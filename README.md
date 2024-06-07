# Dipcord

## Overview

Dipcord is a NodeJS server that runs a Discord bot which integrates with the
Diplicity API.

## Getting Started

- Clone the repo
- Install Docker
- Run `docker-compose up`
- **Note** when you make a change locally, you need to rebuild the JS files and
  then restart the container process:
  `npm run build && docker-compose restart dipcord-application`. We should try
  to improve this, it's a bit of a headache.
