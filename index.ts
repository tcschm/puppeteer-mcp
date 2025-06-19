#!/usr/bin/env node

import { run } from "./src/main.js";

run().catch(error => {
  console.error("Failed to start Puppeteer MCP Server:", error);
  process.exit(1);
});