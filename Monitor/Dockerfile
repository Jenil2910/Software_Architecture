FROM node:8-alpine
COPY server/package.json /app/package.json
WORKDIR /app
RUN npm install
COPY server/public public
COPY server/views views
COPY server/app.js app.js
EXPOSE 22
EXPOSE 3000

ENTRYPOINT [""]
CMD ["npm", "run", "dev"]
