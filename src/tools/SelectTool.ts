import { Page } from "puppeteer";
import { type CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { AbstractTool } from "./AbstractTool.ts";

interface SelectArgs {
  selector: string;
  value: string;
}

export class SelectTool extends AbstractTool {
  name = "puppeteer_select";
  description = "Select an option in a select element on the page";
  inputSchema = {
    type: "object" as const,
    properties: {
      selector: { type: "string" as const, description: "CSS selector for the select element" },
      value: { type: "string" as const, description: "Value of the option to select" },
    },
    required: ["selector" as const, "value" as const],
  };

  async execute(page: Page, args: SelectArgs): Promise<CallToolResult> {
    try {
      await page.waitForSelector(args.selector);
      await page.select(args.selector, args.value);
      return {
        content: [{ type: "text", text: `Selected option with value '${args.value}' in ${args.selector}` }],
        isError: false,
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Failed to select in ${args.selector}: ${(error as Error).message}` }],
        isError: true,
      };
    }
  }
}