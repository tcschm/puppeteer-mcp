import { Page } from "puppeteer";
import { type CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { AbstractTool } from "./AbstractTool.ts";

interface ClickArgs {
  selector: string;
}

export class ClickTool extends AbstractTool {
  name = "puppeteer_click";
  description = "Click an element on the page";
  inputSchema = {
    type: "object" as const,
    properties: {
      selector: { type: "string" as const, description: "CSS selector for element to click" },
    },
    required: ["selector" as const],
  };

  async execute(page: Page, args: ClickArgs): Promise<CallToolResult> {
    try {
      await page.click(args.selector);
      return {
        content: [{ type: "text", text: `Clicked: ${args.selector}` }],
        isError: false,
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Failed to click ${args.selector}: ${(error as Error).message}` }],
        isError: true,
      };
    }
  }
}