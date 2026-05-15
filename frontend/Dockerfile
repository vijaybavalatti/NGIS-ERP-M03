# Stage 1: Build React
FROM node:20-alpine as build
WORKDIR /app

# Copy package files (the * matches yarn.lock or package-lock.json if they exist)
COPY package.json yarn.lock* package-lock.json* ./

# Install dependencies - works even if lockfile is missing
RUN if [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
    elif [ -f package-lock.json ]; then npm ci; \
    else yarn install; \
    fi

COPY . .
# We leave BACKEND_URL empty so it uses the same domain as the browser
ENV REACT_APP_BACKEND_URL=""
RUN yarn build

# Stage 2: Serve with Nginx
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html

# Ensure nginx.conf is in the frontend/ folder as discussed before
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
