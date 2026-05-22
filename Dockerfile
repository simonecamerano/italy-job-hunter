FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .

RUN mkdir -p data && \
    cp crontab /etc/crontabs/root

CMD ["node", "bot.js"]
