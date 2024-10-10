// src/pages/Profile/Profile.test.jsx
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProfilePage from './Profile';
import { UserContext } from '../../context/UserContext';
import { useProfile } from '../../hooks/useProfile';
import { useBookings } from '../../hooks/useBookings';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import PrivateRoute from '../PrivateRoute';
import axios from 'axios';
import { toast } from 'react-toastify';

// Mock the useProfile and useBookings hooks
vi.mock('../../hooks/useProfile');
vi.mock('../../hooks/useBookings');

const axios = {
    put: vi.fn(),
    post: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
    // Add other methods if needed
  };
// Mock Axios
vi.mock('axios');

// Mock React Toastify
vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('ProfilePage', () => {
  // Mock functions
  const mockSetActiveTab = vi.fn();
  const mockSetIsEditing = vi.fn();
  const mockSetShowModal = vi.fn();
  const mockSetShowChangePasswordModal = vi.fn();
  const mockHandleChangePasswordClick = vi.fn();
  const mockHandleSaveClick = vi.fn();
  const mockHandleSaveSubmit = vi.fn();
  const mockHandleInputChange = vi.fn(() => vi.fn());
  const mockHandleDeleteBooking = vi.fn();

  // Default mock return values for useProfile
  const mockUseProfileDefault = {
    activeTab: 'profile',
    setActiveTab: mockSetActiveTab,
    isEditing: false,
    setIsEditing: mockSetIsEditing,
    showModal: false,
    setShowModal: mockSetShowModal,
    showChangePasswordModal: false,
    setShowChangePasswordModal: mockSetShowChangePasswordModal,
    handleChangePasswordClick: mockHandleChangePasswordClick,
    handleSaveClick: mockHandleSaveClick,
    handleSaveSubmit: mockHandleSaveSubmit,
    formValues: {
      username: 'testuser',
      email: 'test@example.com',
      phone: '+94123456789',
      changesMade: false,
    },
    handleInputChange: mockHandleInputChange,
    login: vi.fn(), // Ensure login is mocked if used
  };

  // Default mock return values for useBookings
  const mockUseBookingsDefault = {
    bookings: [],
    handleDeleteBooking: mockHandleDeleteBooking,
    loading: false,
  };

  // Utility function to render ProfilePage with UserContext
  const renderWithUser = (userData, loading = false) => {
    return render(
      <MemoryRouter initialEntries={['/profile']}>
        <UserContext.Provider value={{ userData, loading }}>
          <Routes>
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <ProfilePage />
                </PrivateRoute>
              }
            />
            <Route path="/login" element={<div>Login Page</div>} />
          </Routes>
        </UserContext.Provider>
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    vi.resetAllMocks();
    useProfile.mockReturnValue(mockUseProfileDefault);
    useBookings.mockReturnValue(mockUseBookingsDefault);
  });

  it('displays loading indicator when loading is true', () => {
    renderWithUser({ username: 'testuser' }, true);
    expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
  });

  it('renders SideMenu and ProfileForm when not loading and user is logged in', () => {
    renderWithUser({ username: 'testuser' }, false);
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/Edit Profile/i)).toBeInTheDocument();
  });

  it('renders BookingHistory when activeTab is "bookings"', () => {
    // Update the mock to set activeTab to 'bookings'
    useProfile.mockReturnValue({
      ...mockUseProfileDefault,
      activeTab: 'bookings',
    });

    renderWithUser({ username: 'testuser' }, false);

    expect(screen.getByText(/No bookings found./i)).toBeInTheDocument();
  });

  it('switches tabs when a different tab is clicked', () => {
    renderWithUser({ username: 'testuser' }, false);

    const bookingsTab = screen.getByText(/Bookings/i);
    fireEvent.click(bookingsTab);

    expect(mockSetActiveTab).toHaveBeenCalledWith('bookings');
  });

  it('redirects to /login when user is not logged in', () => {
    renderWithUser(null, false); // Simulate unauthenticated user

    // Assert that the Login Page is rendered
    expect(screen.getByText(/Login Page/i)).toBeInTheDocument();
  });

  // New Test Cases for Updating User Data and Changing Password

  it('successfully updates user data', async () => {
    // Arrange
    const updatedUserData = {
      username: 'updateduser',
      email: 'updated@example.com',
      phone: '+94123456789',
      changesMade: true,
    };

    // Mock handleInputChange to update formValues
    mockHandleInputChange.mockImplementation((field) => (e) => {
      mockUseProfileDefault.formValues[field] = e.target.value;
    });

    // Mock axios.put to return success
    axios.put.mockResolvedValueOnce({
      status: 200,
      data: {
        username: updatedUserData.username,
        email: updatedUserData.email,
        phone: updatedUserData.phone,
      },
    });

    // Act
    renderWithUser({ username: 'testuser', email: 'test@example.com', phone: '+94123456789' }, false);

    // Fill out the form fields
    const usernameInput = screen.getByLabelText(/Username/i);
    const emailInput = screen.getByLabelText(/Email/i);
    const phoneInput = screen.getByLabelText(/Phone/i);
    const saveButton = screen.getByText(/Save/i);

    fireEvent.change(usernameInput, { target: { value: updatedUserData.username } });
    fireEvent.change(emailInput, { target: { value: updatedUserData.email } });
    fireEvent.change(phoneInput, { target: { value: updatedUserData.phone } });

    fireEvent.click(saveButton);

    // Assert
    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        '/api/user/updateProfile',
        {
          username: updatedUserData.username,
          email: updatedUserData.email,
          phone: updatedUserData.phone,
          oldPassword: '',
          newPassword: '',
        },
        { withCredentials: true }
      );
      expect(mockUseProfileDefault.login).toHaveBeenCalledWith({
        username: updatedUserData.username,
        email: updatedUserData.email,
        phone: updatedUserData.phone,
      });
      expect(toast.success).toHaveBeenCalledWith('Profile updated successfully');
    });
  });

  it('handles API error when updating user data', async () => {
    // Arrange
    const errorMessage = 'Failed to update profile';

    // Mock handleInputChange to update formValues
    mockHandleInputChange.mockImplementation((field) => (e) => {
      mockUseProfileDefault.formValues[field] = e.target.value;
    });

    // Mock axios.put to return error
    axios.put.mockRejectedValueOnce(new Error(errorMessage));

    // Act
    renderWithUser({ username: 'testuser', email: 'test@example.com', phone: '+94123456789' }, false);

    // Fill out the form fields
    const usernameInput = screen.getByLabelText(/Username/i);
    const emailInput = screen.getByLabelText(/Email/i);
    const phoneInput = screen.getByLabelText(/Phone/i);
    const saveButton = screen.getByText(/Save/i);

    fireEvent.change(usernameInput, { target: { value: 'updateduser' } });
    fireEvent.change(emailInput, { target: { value: 'updated@example.com' } });
    fireEvent.change(phoneInput, { target: { value: '+94123456789' } });

    fireEvent.click(saveButton);

    // Assert
    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        '/api/user/updateProfile',
        {
          username: 'updateduser',
          email: 'updated@example.com',
          phone: '+94123456789',
          oldPassword: '',
          newPassword: '',
        },
        { withCredentials: true }
      );
      expect(mockUseProfileDefault.login).not.toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith('Failed to update profile');
    });
  });

  it('successfully changes the password', async () => {
    // Arrange
    const oldPassword = 'oldpassword';
    const newPassword = 'newpassword';

    // Mock handleInputChange for password fields
    mockHandleInputChange.mockImplementation((field) => (e) => {
      mockUseProfileDefault.formValues[field] = e.target.value;
    });

    // Mock axios.put to return success for password change
    axios.put.mockResolvedValueOnce({
      status: 200,
      data: {
        message: 'Password changed successfully',
      },
    });

    // Act
    renderWithUser({ username: 'testuser', email: 'test@example.com', phone: '+94123456789' }, false);

    // Click on "Change Password" button to open modal
    const changePasswordButton = screen.getByText(/Change Password/i);
    fireEvent.click(changePasswordButton);

    // Fill out the password fields in the modal
    const oldPasswordInput = screen.getByLabelText(/Old Password/i);
    const newPasswordInput = screen.getByLabelText(/New Password/i);
    const confirmPasswordInput = screen.getByLabelText(/Confirm New Password/i);
    const submitPasswordButton = screen.getByText(/Submit/i);

    fireEvent.change(oldPasswordInput, { target: { value: oldPassword } });
    fireEvent.change(newPasswordInput, { target: { value: newPassword } });
    fireEvent.change(confirmPasswordInput, { target: { value: newPassword } });

    fireEvent.click(submitPasswordButton);

    // Assert
    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        '/api/user/updatePassword',
        {
          oldPassword,
          newPassword,
        },
        { withCredentials: true }
      );
      expect(toast.success).toHaveBeenCalledWith('Password changed successfully');
    });
  });

  it('handles API error when changing the password', async () => {
    // Arrange
    const oldPassword = 'wrongpassword';
    const newPassword = 'newpassword';
    const errorMessage = 'Incorrect old password';

    // Mock handleInputChange for password fields
    mockHandleInputChange.mockImplementation((field) => (e) => {
      mockUseProfileDefault.formValues[field] = e.target.value;
    });

    // Mock axios.put to return error for password change
    axios.put.mockRejectedValueOnce(new Error(errorMessage));

    // Act
    renderWithUser({ username: 'testuser', email: 'test@example.com', phone: '+94123456789' }, false);

    // Click on "Change Password" button to open modal
    const changePasswordButton = screen.getByText(/Change Password/i);
    fireEvent.click(changePasswordButton);

    // Fill out the password fields in the modal
    const oldPasswordInput = screen.getByLabelText(/Old Password/i);
    const newPasswordInput = screen.getByLabelText(/New Password/i);
    const confirmPasswordInput = screen.getByLabelText(/Confirm New Password/i);
    const submitPasswordButton = screen.getByText(/Submit/i);

    fireEvent.change(oldPasswordInput, { target: { value: oldPassword } });
    fireEvent.change(newPasswordInput, { target: { value: newPassword } });
    fireEvent.change(confirmPasswordInput, { target: { value: newPassword } });

    fireEvent.click(submitPasswordButton);

    // Assert
    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        '/api/user/updatePassword',
        {
          oldPassword,
          newPassword,
        },
        { withCredentials: true }
      );
      expect(toast.error).toHaveBeenCalledWith('Failed to update profile'); // Adjust error message as per implementation
    });
  });
});
