# --- STAGE 1: Build the React Application ---
FROM node:20-alpine as builder

WORKDIR /app

# 1. Copy all necessary files from the local frontend/ directory 
#    into the container's /app directory. This includes package.json, 
#    index.html, vite.config.js, and the entire src/ folder.
COPY frontend/ .

# 2. Install dependencies
RUN npm install

# 3. Run the build command
RUN npm run build

# --- STAGE 2: Serve the Static Files with Nginx ---
FROM nginx:alpine

# Copy the built static files from the builder stage into Nginx's HTML directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx runs on port 80 by default
EXPOSE 80

# The default CMD in nginx:alpine runs Nginx
CMD ["nginx", "-g", "daemon off;"]
