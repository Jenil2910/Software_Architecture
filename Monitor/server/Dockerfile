FROM node:8-alpine
COPY server/package.json /app/package.json
COPY server/app.js /app/app.js
WORKDIR /app
RUN npm install
EXPOSE 22
EXPOSE 3000


ENTRYPOINT [""]
CMD ["npm", "run", "dev"]
