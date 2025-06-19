import { Page } from "puppeteer";
import { type CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { AbstractTool } from "./AbstractTool.js";

// this declaration augments the global window type for typescript when working with page.evaluate
// ensure "dom" is in your tsconfig.json's "lib" array.
declare global {
  interface Window {
    mcpHelper?: { // made optional as it's dynamically added/removed
      logs: string[];
      originalConsole: Partial<typeof console>;
    }
  }
}

export class EvaluateTool extends AbstractTool {
  name = "puppeteer_evaluate";
  description = "Execute JavaScript in the browser console";
  inputSchema = {
    type: "object" as const,
    properties: {
      script: { type: "string" as const, description: "JavaScript code to execute" },
    },
    required: ["script" as const],
  };

  async execute(page: Page, args: { script: string }): Promise<CallToolResult> {
    try {
      await page.evaluate(() => {
        window.mcpHelper = {
          logs: [],
          originalConsole: { ...console },
        };

        (['log', 'info', 'warn', 'error'] as (keyof Console)[]).forEach(method => {
          if (typeof console[method] === 'function') {
            const originalMethod = console[method] as (...args: any[]) => void;
            (console as any)[method] = (...evalArgs: any[]) => {
              window.mcpHelper?.logs.push(`[${method}] ${evalArgs.map(String).join(' ')}`);
              originalMethod.apply(console, evalArgs);
            };
          }
        });
      });

      const result = await page.evaluate(args.script);

      const logs = await page.evaluate(() => {
        if (window.mcpHelper?.originalConsole) {
          Object.assign(console, window.mcpHelper.originalConsole);
        }
        const mcpLogs = window.mcpHelper?.logs || [];
        delete (window as any).mcpHelper; // clean up
        return mcpLogs;
      });

      return {
        content: [{
          type: "text",
          text: `Execution result:\n${JSON.stringify(result, null, 2)}\n\nConsole output:\n${logs.join('\n')}`,
        }],
        isError: false,
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Script execution failed: ${(error as Error).message}` }],
        isError: true,
      };
    }
  }
}