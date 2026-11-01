#!/usr/bin/env node
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const liveServer = require('live-server');

// Start a live-server instance programmatically
liveServer.start({
  port: 8080,
  root: './',         // root directory to serve
  file: 'index.html', // default file to serve
  open: true,         // open in browser
  watch: ['.'],       // watch all files for reload
});
