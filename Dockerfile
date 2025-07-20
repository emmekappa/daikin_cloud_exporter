FROM node:24-alpine

WORKDIR /app

# Copia package files
COPY package*.json ./
RUN npm ci --only=production

# Copia source code
COPY dist/ ./dist/

# Espone la porta
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1))"

CMD ["node", "dist/integration-example.js"]
