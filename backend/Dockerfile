FROM node:22-alpine

WORKDIR /app

# ✅ Kopiuj package.json z backend
COPY backend/package*.json ./
RUN npm ci

# ✅ Kopiuj cały backend
COPY backend/ .

# ✅ Generuj Prisma
RUN if [ -f prisma/schema.prisma ]; then \
        npx prisma generate; \
    fi

EXPOSE 3000

CMD ["npm", "start"]