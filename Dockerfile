FROM node:24.3.0-slim

RUN apt-get update && apt-get install -y --no-install-recommends dumb-init && rm -rf /var/lib/apt/lists/*

ENV DIR="/app"
WORKDIR $DIR

COPY package*.json ./
COPY tsconfig*.json ./
COPY src ./src


RUN npm install
RUN npm run build

EXPOSE 3001

ENTRYPOINT ["dumb-init", "--"]


CMD npm start