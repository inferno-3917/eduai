FROM node:18-slim

WORKDIR /app

COPY package*.json ./

# Install all dependencies (including devDependencies like typescript and rimraf)
RUN npm install

COPY . .

# Compile TypeScript to JavaScript
RUN npm run build

# Remove development dependencies to keep the image small
RUN npm prune --production

EXPOSE 5000

CMD ["node", "dist/app.js"]
