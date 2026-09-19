FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# We will run ts-node-dev for local development in the container
CMD ["npm", "run", "dev"]
