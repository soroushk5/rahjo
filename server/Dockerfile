FROM node:22-alpine@sha256:c610fcdfb1d5b4740dd70c284ed3cb16bb857e0f7166196e36a5501df7a3aa32

ENV NODE_ENV=production
WORKDIR /opt/rahjo/server

COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

COPY server/migrations ./migrations
COPY server/scripts ./scripts
COPY server/src ./src

USER node
EXPOSE 8787
CMD ["node", "src/index.js"]
