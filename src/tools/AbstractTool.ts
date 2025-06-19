import { Page } from "puppeteer";
import type { CallToolResult, Tool } from "@modelcontextprotocol/sdk/types.js";

export abstract class AbstractTool implements Tool {
  [key: string]: any;
  abstract name: string;
  abstract description: string;
  abstract inputSchema: Tool["inputSchema"];

  abstract execute(page: Page, args: any, browserManager?: any /* BrowserManager if needed directly */): Promise<CallToolResult>;

  public getToolDefinition(): Tool {
    return {
      name: this.name,
      description: this.description,
      inputSchema: this.inputSchema,
    };
  }
}