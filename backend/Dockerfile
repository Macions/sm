FROM node:22-alpine

WORKDIR /app

# ✅ Kopiuj package.json
COPY package*.json ./

# ✅ Zainstaluj zależności (w tym prisma)
RUN npm ci

# ✅ Kopiuj resztę plików backendu
COPY . .

# ✅ Sprawdź czy schema istnieje i wygeneruj
RUN if [ -f prisma/schema.prisma ]; then \
        echo "✅ Generuję Prisma..." && \
        npx prisma generate; \
    else \
        echo "⚠️ Brak schema.prisma - pomijam"; \
    fi

EXPOSE 3000

CMD ["npm", "start"]