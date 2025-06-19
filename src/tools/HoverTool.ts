import { Page } from "puppeteer";
import { type CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { AbstractTool } from "./AbstractTool.ts";

interface HoverArgs {
  selector: string;
}

export class HoverTool extends AbstractTool {
  name = "puppeteer_hover";
  description = "Hover over an element on the page";
  inputSchema = {
    type: "object" as const,
    properties: {
      selector: { type: "string" as const, description: "CSS selector for element to hover" },
    },
    required: ["selector" as const],
  };

  async execute(page: Page, args: HoverArgs): Promise<CallToolResult> {
    try {
      await page.waitForSelector(args.selector);
      await page.hover(args.selector);
      return {
        content: [{ type: "text", text: `Hovered over: ${args.selector}` }],
        isError: false,
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Failed to hover ${args.selector}: ${(error as Error).message}` }],
        isError: true,
      };
    }
  }
}