FROM alpine:3.3

RUN apk add --update nodejs git

RUN mkdir /app

WORKDIR /app
COPY . /app

RUN npm install
RUN npm run gulp

EXPOSE 113
EXPOSE 3000
EXPOSE 6667
EXPOSE 6697

CMD ["node", ".", "run"]