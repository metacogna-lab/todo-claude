FROM node:22-alpine

WORKDIR /app
COPY package.json tsconfig.json eslint.config.js ./
COPY src ./src
COPY tests ./tests
COPY README.md ./

RUN npm install
RUN npm run build

CMD ["node", "dist/index.js", "doctor"]
