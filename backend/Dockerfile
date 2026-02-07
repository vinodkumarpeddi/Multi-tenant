FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Add curl for healthcheck
RUN apk --no-cache add curl

EXPOSE 5000

CMD ["npm", "run", "dev"]
