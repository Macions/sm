FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_GOOGLE_CLIENT_ID=1052297951817-2n30d1tja0c0vlgv7ld6bfai9cmbq0ue.apps.googleusercontent.com
ARG VITE_API_URL=https://panel.silamlodych.pl
ARG VITE_HOST=0.0.0.0
ARG DOCKER_ENV=true
ARG VITE_ALLOWED_HOSTS=turbine-protector-aluminum.ngrok-free.dev

ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_HOST=$VITE_HOST
ENV DOCKER_ENV=$DOCKER_ENV
ENV VITE_ALLOWED_HOSTS=$VITE_ALLOWED_HOSTS

RUN test -n "$VITE_GOOGLE_CLIENT_ID"
RUN test -n "$VITE_API_URL"

RUN echo "Building with VITE_API_URL: $VITE_API_URL"

RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
