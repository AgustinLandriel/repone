# Stage 1 — builder
FROM node:22-alpine AS builder
WORKDIR /app

# Copio solo los manifiestos de deps primero
COPY package*.json ./
# Instalo TODO (incluidas devDeps, necesito tsc para compilar)
RUN npm ci

COPY tsconfig.json ./
# Recién ahora copio el código fuente
COPY src ./src
# Corre tsc: compila TS a JS y lo deja en /app/dist
RUN npm run build

# Stage 2 — la imagen final
# Arranca de cero, otra imagen limpia (NO hereda nada del builder)
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
# Instalo SOLO deps de producción, sin devDeps (más liviano)
RUN npm ci --omit=dev

# COPY --from=builder conecta las dos etapas: trae un archivo/carpeta puntual
# del stage anterior sin arrastrar nada más (ni node_modules de dev, ni el
# código fuente .ts, ni tsc)
COPY --from=builder --chown=node:node /app/dist ./dist

# Carpeta donde vive el .db de SQLite
RUN mkdir -p /app/data && chown node:node /app/data

# Documenta qué puerto escucha (no abre nada por sí solo)
EXPOSE 3002
# A partir de acá, el proceso corre como usuario no-root
USER node
# Comando que se ejecuta al levantar el contenedor
CMD ["node", "dist/index.js"]
