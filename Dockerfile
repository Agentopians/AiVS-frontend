# Stage 1: Build the application
FROM node:23-alpine AS build

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./

# Install dependencies
RUN npm ci

# Stage 2: Run the application
FROM node:23-alpine

# Set working directory
WORKDIR /app

# Copy dependencies from the build stage
COPY --from=build /app/node_modules ./node_modules

# Copy the rest of the application code
COPY --from=build /app .

# Expose port 3000 (or the port your app listens on)
EXPOSE 3000

# Start the application
CMD ["npm", "start"]