# Stage 1: Build the Node.js app
FROM node:18-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --production

COPY . .

# If your project requires a build step (e.g., if you are using TypeScript)
# RUN npm run build

# Stage 2: Run the app
FROM node:18-alpine

WORKDIR /app

# Copy only the production node_modules and the rest of the built app from the previous stage
COPY --from=build /app .

# Expose the port that your Node.js app listens on
EXPOSE 3000

# Start the Node.js application
CMD ["npm", "start"]
