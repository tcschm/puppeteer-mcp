import { Page } from "puppeteer";
import { type CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { AbstractTool } from "./AbstractTool.ts";

interface FillArgs {
  selector: string;
  value: string;
}

export class FillTool extends AbstractTool {
  name = "puppeteer_fill";
  description = "Fill out an input field";
  inputSchema = {
    type: "object" as const,
    properties: {
      selector: { type: "string" as const, description: "CSS selector for input field" },
      value: { type: "string" as const, description: "Value to fill" },
    },
    required: ["selector" as const, "value" as const],
  };

  async execute(page: Page, args: FillArgs): Promise<CallToolResult> {
    try {
      await page.waitForSelector(args.selector);
      await page.type(args.selector, args.value);
      return {
        content: [{ type: "text", text: `Filled ${args.selector} with: ${args.value}` }],
        isError: false,
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Failed to fill ${args.selector}: ${(error as Error).message}` }],
        isError: true,
      };
    }
  }
}