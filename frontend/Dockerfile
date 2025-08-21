FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci
CMD ["npm", "run", "dev", "--", "--host", "--port", "5173"]
