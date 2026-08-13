# Frontend Dockerfile
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# ✅ DODAJ WSZYSTKIE ZMIENNE VITE
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_API_URL
ARG VITE_HOST
ARG DOCKER_ENV
ARG VITE_ALLOWED_HOSTS

# ✅ USTAW JE JAKO ENV (budowane w kodzie)
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_HOST=$VITE_HOST
ENV DOCKER_ENV=$DOCKER_ENV
ENV VITE_ALLOWED_HOSTS=$VITE_ALLOWED_HOSTS

# ✅ DODAJ LOGI - zobaczysz w konsoli podczas builda
RUN echo "🔧 Building with VITE_API_URL: $VITE_API_URL"

RUN npm run build

FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]