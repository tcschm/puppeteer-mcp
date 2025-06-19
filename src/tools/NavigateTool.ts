import { Page, HTTPResponse } from "puppeteer"; // import httresponse
import { type CallToolResult, type TextContent } from "@modelcontextprotocol/sdk/types.js";
import { AbstractTool } from "./AbstractTool.js";

export class NavigateTool extends AbstractTool {
  name = "puppeteer_navigate";
  description = "Navigate to a URL";
  inputSchema = {
    type: "object" as const,
    properties: {
      url: { type: "string" as const, description: "URL to navigate to" },
      // launchoptions and allowdangerous are handled by browsermanager,
      // but kept here for schema compatibility if clients expect them.
      // they are passed to ensurebrowserandpage.
      launchOptions: { type: "object" as const, description: "PuppeteerJS LaunchOptions. Default null. If changed and not null, browser restarts. Example: { headless: true, args: ['--no-sandbox'] }" },
      allowDangerous: { type: "boolean" as const, description: "Allow dangerous LaunchOptions that reduce security. When false, dangerous args like --no-sandbox will throw errors. Default false." },
    },
    required: ["url" as const],
  };

  async execute(page: Page, args: { url: string }): Promise<CallToolResult> {
    try {
      // wait until the network is idle to ensure the page is fully loaded
      const response: HTTPResponse | null = await page.goto(args.url, { waitUntil: 'networkidle0' });

      if (!response) {
        // this case can occur if navigation is aborted or fails without a response object
        return {
          content: [{
            type: "text",
            text: `Navigation to ${args.url} failed to produce a response.`,
          } as TextContent],
          isError: true,
        };
      }

      if (!response.ok()) {
        // http status codes like 4xx or 5xx indicate an error
        return {
          content: [{
            type: "text",
            text: `Navigation to ${args.url} failed with status: ${response.status()} ${response.statusText()}`,
          } as TextContent],
          isError: true,
        };
      }

      return {
        content: [{
          type: "text",
          text: `Navigated to ${args.url} successfully. Status: ${response.status()}`,
        } as TextContent],
        isError: false,
      };
    } catch (error: any) {
      // this catches errors like timeouts, dns resolution failures, etc.
      return {
        content: [{ type: "text", text: `Navigation to ${args.url} failed: ${error.message}` } as TextContent],
        isError: true,
      };
    }
  }
}