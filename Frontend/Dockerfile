# =============================================================================
# STAGE 1: FRONTEND BUILDER STAGE
# =============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install dependencies with frozen lockfile
RUN npm ci

# Copy frontend source code
COPY . .

# Compile optimized production bundle
RUN npm run build

# =============================================================================
# STAGE 2: PRODUCTION NGINX STATIC WEB SERVER
# Lightweight Alpine runtime (<25MB) with SPA routing & edge caching headers
# =============================================================================
FROM nginx:alpine AS runner

# Remove default nginx website
RUN rm -rf /usr/share/nginx/html/*

# Copy built production assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Custom Nginx configuration supporting React SPA client-side routing & compression
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html; \
    \
    # Gzip Compression \
    gzip on; \
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml; \
    gzip_min_length 1024; \
    \
    # Static Assets Long-Term Caching \
    location /assets/ { \
        expires 1y; \
        add_header Cache-Control "public, max-age=31536000, immutable"; \
    } \
    \
    # SPA HTML5 History Mode Routing \
    location / { \
        try_files $uri $uri/ /index.html; \
        add_header Cache-Control "no-cache"; \
    } \
    \
    # Container Health Check \
    location /healthz { \
        return 200 "OK\n"; \
        add_header Content-Type text/plain; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
