import { Page } from "puppeteer";
import type { CallToolResult, TextContent, ImageContent } from "@modelcontextprotocol/sdk/types.js";
import { AbstractTool } from "./AbstractTool.js";

interface ScreenshotArgs {
  name: string;
  selector?: string;
  width?: number;
  height?: number;
  encoded?: boolean;
}

export class ScreenshotTool extends AbstractTool {
  name = "puppeteer_screenshot";
  description = "Take a screenshot of the current page or a specific element";
  inputSchema = {
    type: "object" as const,
    properties: {
      name: { type: "string" as const, description: "Name for the screenshot" },
      selector: { type: "string" as const, description: "CSS selector for element to screenshot" },
      width: { type: "number" as const, description: "Width in pixels (default: 800)" },
      height: { type: "number" as const, description: "Height in pixels (default: 600)" },
      encoded: { type: "boolean" as const, description: "If true, capture the screenshot as a base64-encoded data URI (as text) instead of binary image content. Default false." },
    },
    required: ["name" as const],
  };

  // this tool needs to update the global screenshots map, so it might need a callback or event
  // for now, we'll assume the main server logic handles adding it to the map
  async execute(page: Page, args: ScreenshotArgs): Promise<CallToolResult> {
    const width = args.width ?? 800;
    const height = args.height ?? 600;
    const encoded = args.encoded ?? false;
    await page.setViewport({ width, height });

    const screenshotBuffer = await (args.selector
      ? (await page.$(args.selector))?.screenshot()
      : page.screenshot({ fullPage: false }));

    if (!screenshotBuffer) {
      return {
        content: [{
          type: "text",
          text: args.selector ? `Element not found: ${args.selector}` : "Screenshot failed",
        }],
        isError: true,
      };
    }
    const screenshotBase64 = screenshotBuffer.toString('base64');

    return {
      toolState: { name: args.name, data: screenshotBase64 }, // pass data back to main to store
      content: [
        {
          type: "text",
          text: `Screenshot '${args.name}' taken at ${width}x${height}`,
        } as TextContent,
        encoded ? ({
          type: "text",
          text: `data:image/png;base64,${screenshotBase64}`,
        } as TextContent) : ({
          type: "image",
          data: screenshotBase64, // sdk expects base64 string for image data
          mimeType: "image/png",
        } as ImageContent),
      ],
      isError: false,
    };
  }
}