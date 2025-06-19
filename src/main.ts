import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  type CallToolResult,
} from "@modelcontextprotocol/sdk/types.js";
import { BrowserManager } from "./browser/BrowserManager.ts";
import { ToolRegistry } from "./ToolRegistry.js";
import { type BrowserManagerLaunchOptions } from "./types.ts";

const screenshots = new Map<string, string>(); // base64 encoded image data

const server = new Server(
  {
    name: "example-servers/puppeteer",
    version: "0.1.1", // incremented version
  },
  {
    capabilities: {
      resources: {}, // can be dynamically populated if needed
      tools: {},     // can be dynamically populated if needed
    },
  },
);

const browserManager = new BrowserManager(server);
const toolRegistry = new ToolRegistry();

async function handleToolCall(name: string, args: any): Promise<CallToolResult> {
  const tool = toolRegistry.getTool(name);
  if (!tool) {
    return {
      content: [{ type: "text", text: `Unknown tool: ${name}` }],
      isError: true,
    };
  }

  // extract browser-specific options for ensurebrowserandpage
  const browserOptions: BrowserManagerLaunchOptions = {
    launchOptions: args.launchOptions,
    allowDangerous: args.allowDangerous,
  };

  try {
    const page = await browserManager.ensureBrowserAndPage(browserOptions);
    const result = await tool.execute(page, args, browserManager);

    // handle screenshot saving if tool indicates it (e.g. via toolstate)
    if (result.toolState && typeof result.toolState === 'object' && 'name' in result.toolState && 'data' in result.toolState) {
        const state = result.toolState as { name: string, data: string };
        screenshots.set(state.name, state.data);
        server.notification({
            method: "notifications/resources/list_changed",
        });
    }
    return result;

  } catch (error: any) {
    return {
      content: [{ type: "text", text: `Tool execution failed: ${error.message}` }],
      isError: true,
    };
  }
}

// Setup request handlers
server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [
    {
      uri: "console://logs",
      mimeType: "text/plain",
      name: "Browser console logs",
    },
    ...Array.from(screenshots.keys()).map(name => ({
      uri: `screenshot://${name}`,
      mimeType: "image/png",
      name: `Screenshot: ${name}`,
    })),
  ],
}));

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri.toString();

  if (uri === "console://logs") {
    return {
      contents: [{
        uri,
        mimeType: "text/plain",
        text: browserManager.getConsoleLogs().join("\n"),
      }],
    };
  }

  if (uri.startsWith("screenshot://")) {
    const name = uri.split("://")[1];
    const screenshot = screenshots.get(name);
    if (screenshot) {
      return {
        contents: [{
          uri,
          mimeType: "image/png",
          blob: screenshot,
        }],
      };
    }
  }

  throw new Error(`Resource not found: ${uri}`);
});

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: toolRegistry.getAllTools(),
}));

server.setRequestHandler(CallToolRequestSchema, async (request) =>
  handleToolCall(request.params.name, request.params.arguments ?? {})
);

export async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Puppeteer MCP Server connected and running.");
}

process.on("SIGINT", async () => {
  console.error("Puppeteer MCP Server shutting down (SIGINT)...");
  await browserManager.closeBrowser();
  server.close();
  process.exit(0);
});

// a stdin close event might also be useful for graceful shutdown
process.stdin.on("close", async () => {
  console.error("Puppeteer MCP Server stdin closed, shutting down...");
  await browserManager.closeBrowser();
  server.close();
  process.exit(0);
});