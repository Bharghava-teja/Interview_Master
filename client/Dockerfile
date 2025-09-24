# Multi-stage build for React application
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --silent

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage with Nginx
FROM nginx:alpine AS production

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built application from builder stage
COPY --from=builder /app/build /usr/share/nginx/html

# Create non-root user for security
RUN addgroup -g 1001 -S nginx
RUN adduser -S nginxuser -u 1001 -G nginx

# Set proper permissions
RUN chown -R nginxuser:nginx /usr/share/nginx/html
RUN chown -R nginxuser:nginx /var/cache/nginx
RUN chown -R nginxuser:nginx /var/log/nginx
RUN chown -R nginxuser:nginx /etc/nginx/conf.d
RUN touch /var/run/nginx.pid
RUN chown -R nginxuser:nginx /var/run/nginx.pid

# Switch to non-root user
USER nginxuser

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]