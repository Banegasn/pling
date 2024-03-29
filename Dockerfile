# Use the official Node.js image as the base image
FROM node:12

# Set the working directory in the container
WORKDIR /app

# Copy the application files into the working directory
COPY . /app

# Install the application dependencies
RUN npm set unsafe-perm true
RUN npm install
RUN npm run build 

ENV PORT 8080
EXPOSE 8080

# Define the entry point for the container
CMD ["npm", "start"]