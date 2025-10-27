# Use a Node.js base image
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and install dependencies
# Source path is relative to the root context
COPY backend/package.json .
RUN npm install --omit=dev

# Copy the server file and the PEM key from the root context
# Source: backend/server.js (relative to root context) -> Destination: . (current WORKDIR)
COPY backend/server.js .

# Source: subgateway.pem (relative to root context) -> Destination: . (current WORKDIR)
COPY subgateway.pem .

# Expose the port the Node/Express server is listening on
EXPOSE 5000

# Command to run the application
CMD [ "node", "server.js" ]