# RailWise - Train Booking System (Backend)

## Overview

RailWise is a train booking system designed to provide a seamless experience for users to search for trains, select seats, and book tickets. This backend is built using **Node.js** and **Express** and offers various API endpoints for handling bookings, schedules, user authentication, and admin functionalities.

## Features

- **Train Schedule Management**: View and manage train schedules.
- **Booking Management**: Create, confirm, and cancel bookings.
- **User Authentication**: User registration, login, and profile management.
- **Admin Dashboard**: Monitor bookings, manage schedules, and view analytics.
- **Secure Payments**: Integrate with Stripe (test mode) for secure transactions.

## Tech Stack

- **Backend**: Node.js, Express
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)
- **API Documentation**: Postman Collection (API testing and documentation)
- **API Testing**: Insomnia (Used by developers)

## Installation and Setup

### Prerequisites

- **Node.js** (v14 or higher)
- **MongoDB** (local or cloud instance)
- **NPM** (v6 or higher) or **Yarn**

### Clone the Repository

```bash
git clone https://github.com/PasanMadhuranga/RailWise-Backend.git
cd RailWise-Backend
```

### Install Dependencies

```bash
npm install
```

or

```bash
yarn install
```

### Environment Variables

Create a `.env` file in the project root and add the following variables:

```bash
JWT_SECRET=<your_jwt_secret>
DB_URL=<your_mongodb_url>
EMAIL=<your_email>
APP_PASSWORD=<your_email_app_password>
CLIENT_URL=<your_frontend_url>
STRIPE_SECRET_KEY=<your_stripe_secret_key>
SMS_API_KEY=<your_sms_api_key>
SMS_SENDER_ID=<your_sms_sender_id>
SMS_USER_ID=<your_sms_user_id>
BACKEND_URL=<your_backend_url>
```

### Running the Application

To start the development server:

```bash
npm run dev
```

This will start the server at `http://localhost:3000` by default.

### Running Tests

We use **Jest** for unit testing. To run tests:

```bash
npm run test
```

Here’s the API Endpoints section with a visually appealing format, using tables for clear presentation:

---

## API Endpoints

The backend is structured into multiple routes, each serving specific functionalities.

### Admin Routes (`/api/admin`)

| Method | Endpoint                                           | Description                                              |
| ------ | -------------------------------------------------- | -------------------------------------------------------- |
| GET    | `/schedules`                                       | Fetch all schedules.                                     |
| POST   | `/login`                                           | Admin login.                                             |
| GET    | `/bookingsCount/:status/:scheduleId/:timeFrame`    | Fetch booking counts based on status and schedule.       |
| GET    | `/totalFare/:scheduleId/:timeFrame`                | Fetch total fare for a specific schedule and time frame. |
| GET    | `/userRegistrations/:timeFrame`                    | Fetch user registration stats.                           |
| GET    | `/bookingClassDistribution/:scheduleId/:timeFrame` | Fetch booking class distribution for a schedule.         |
| GET    | `/bookingsDetails/:status/:scheduleId`             | Get booking details for a specific schedule.             |
| GET    | `/schedulesDetails`                                | Get details of all schedules.                            |
| POST   | `/PlatformChange`                                  | Change the platform for a train.                         |
| GET    | `/getHalts/:scheduleId`                            | Get the halts for a specific schedule.                   |
| POST   | `/TimeChange`                                      | Change the schedule time for a train.                    |

### Booking Routes (`/api/bookings`)

| Method | Endpoint                                        | Description                                                       |
| ------ | ----------------------------------------------- | ----------------------------------------------------------------- |
| POST   | `/createPendingBooking`                         | Create a pending booking (validate before final confirmation).    |
| POST   | `/confirmBooking`                               | Confirm the booking after payment.                                |
| GET    | `/validateTicket/:bookingId/:seatId/:signature` | Validate an e-ticket based on booking ID, seat ID, and signature. |
| GET    | `/:bookingId`                                   | Get booking details based on booking ID.                          |
| DELETE | `/:bookingId`                                   | Cancel booking with the given booking ID (requires token).        |

### Schedule Routes (`/api/schedules`)

| Method | Endpoint           | Description                         |
| ------ | ------------------ | ----------------------------------- |
| GET    | `/`                | Fetch all schedules.                |
| GET    | `/scheduleDetails` | Get details of a specific schedule. |
| GET    | `/wagonsOfClass`   | Get wagon information by class.     |
| GET    | `/popularRoutes`   | Fetch popular train routes.         |

### Station Routes (`/api/stations`)

| Method | Endpoint | Description                    |
| ------ | -------- | ------------------------------ |
| GET    | `/`      | Fetch all station information. |

### User Routes (`/api/user`)

| Method | Endpoint          | Description                                                       |
| ------ | ----------------- | ----------------------------------------------------------------- |
| POST   | `/register`       | Register a new user (validates user details before registration). |
| POST   | `/login`          | User login.                                                       |
| GET    | `/logout`         | Logout the user (requires token verification).                    |
| GET    | `/bookingHistory` | Fetch booking history for the logged-in user (requires token).    |
| PUT    | `/updateProfile`  | Update user profile information (requires token).                 |
| POST   | `/forgotPassword` | Send password reset instructions to the user's email.             |
| PUT    | `/resetPassword`  | Reset the user's password after verification.                     |

---

This format improves clarity and readability by organizing the information in tables. Let me know if you need further modifications!

## Middleware

- **verifyToken**: Ensures that the user is authenticated by verifying the JWT token.
- **validatePendingBooking**: Validates booking data before creating a pending booking.
- **validateUserRegistration**: Validates user registration details before processing.

## Folder Structure

```bash
├── controllers          # Logic for handling different requests
│   ├── admin.controller.js
│   ├── booking.controller.js
│   ├── schedule.controller.js
│   ├── station.controller.js
│   └── user.controller.js
│   ├── helpers           # Helper functions for controllers
│   │   ├── admin.helper.js
│   │   ├── booking.helper.js
│   │   ├── schedule.helper.js
│   │   └── user.helper.js
├── models               # MongoDB models for different entities
│   ├── admin.model.js
│   ├── booking.model.js
│   ├── halt.model.js
│   ├── schedule.model.js
│   ├── seat.model.js
│   ├── station.model.js
│   ├── train.model.js
│   ├── user.model.js
│   ├── wagon.model.js
│   └── wagonClass.model.js
├── routes               # API routes for various functionalities
│   ├── admin.route.js
│   ├── booking.route.js
│   ├── schedule.route.js
│   ├── station.route.js
│   └── user.route.js
├── utils                # Utility functions and middleware
│   ├── catchAsync.utils.js
│   ├── middleware.utils.js
│   └── email.utils.js
├── .env                 # Environment variables
├── index.js            # Application entry point
├── package.json         # Project dependencies and scripts
```

## Contribution

The project is maintained by:

- **Sarathchandra D.M.P.M. (210577K)**
- **Senaratne R.R.S.N. (210592C)**
- **Senevirathne R.J.M. (210598B)**
