FROM node

# Create app directory
RUN mkdir -p /autopilot
WORKDIR /autopilot

# Install app dependencies
COPY package.json /autopilot
RUN npm install

# Set the env template as default
COPY .env.template /autopilot/.env

# Bundle app source
COPY . /autopilot

ENTRYPOINT [ "node", "ui", "-d", "/code"]