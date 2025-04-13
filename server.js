const path = require('path');
const express = require('express');
const { createRequestHandler } = require('@remix-run/express');

const app = express();
const BUILD_DIR = path.join(process.cwd(), 'build');

// Serve static files from public directory
app.use(express.static('public'));

// All routes use Remix request handler
app.all(
  '*',
  createRequestHandler({
    build: require(BUILD_DIR),
    mode: process.env.NODE_ENV
  })
);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Express server listening on port ${port}`);
}); 