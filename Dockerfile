FROM node:20-bookworm-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json ./
RUN npm install
RUN npx playwright install --with-deps chromium

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
