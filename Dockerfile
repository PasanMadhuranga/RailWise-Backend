# Stage 1: Build the Node.js app
FROM node:18 AS build

# Set the working directory inside the container
WORKDIR /app

# Copy the package.json and package-lock.json to the container
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy all other files to the container
COPY . .

# If your project requires a build step (e.g., if you are using TypeScript)
# RUN npm run build

# Expose the port that your Node.js app listens on
EXPOSE 3000

# Start the Node.js application
CMD ["npm", "start"]
