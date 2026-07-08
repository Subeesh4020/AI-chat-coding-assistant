# Stage 1: Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Compiles your TypeScript code into a clean JavaScript /dist folder
RUN npm run build 

# Stage 2: Production execution stage
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
# Installs only lightweight production dependencies (no devDependencies)
RUN npm ci --only=production
# Copies only the compiled JavaScript files from the builder stage
COPY --from=builder /app/dist ./dist
# If you use raw assets like folders or views, copy them here too

EXPOSE 5000
CMD ["node", "dist/index.js"]
