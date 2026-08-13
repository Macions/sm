FROM node:22-alpine

WORKDIR /app

# ✅ Kopiuj package.json
COPY package*.json ./

# ✅ Zainstaluj zależności
RUN npm ci

# ✅ Kopiuj resztę plików
COPY . .

# ❌ USUŃ TĘ LINIĘ CAŁKOWICIE:
# RUN npx prisma generate

EXPOSE 3000

CMD ["npm", "start"]