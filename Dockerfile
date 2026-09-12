FROM node:22-alpine

# 1. Set production environment
ENV NODE_ENV=production
WORKDIR /app

# 2. Copy dependency manifests and install
COPY --chown=node:node package*.json ./
RUN npm ci --omit=dev

# 3. Copy application code
COPY --chown=node:node . .

# 4. DevSecOps: Update OS packages, force the latest npm version, 
#    and completely purge unused global package managers (yarn, corepack)
RUN apk update && apk upgrade --no-cache \
    && npm install -g npm@latest \
    && rm -rf /opt/yarn-* \
    && rm -rf /usr/local/bin/yarn \
    && rm -rf /usr/local/bin/yarnpkg \
    && rm -rf /usr/local/lib/node_modules/corepack \
    && rm -rf /usr/local/bin/corepack

# 5. DevSecOps best practice: do not run the container as root
USER node

EXPOSE 3000

CMD ["npm", "start"]