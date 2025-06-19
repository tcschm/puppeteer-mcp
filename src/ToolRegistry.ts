import { type Tool } from "@modelcontextprotocol/sdk/types.js";
import { AbstractTool } from "./tools/AbstractTool.ts";
import { NavigateTool } from "./tools/NavigateTool.ts";
import { ScreenshotTool } from "./tools/ScreenshotTool.ts";
import { ClickTool } from "./tools/ClickTool.ts";
import { FillTool } from "./tools/FillTool.ts";
import { SelectTool } from "./tools/SelectTool.ts";
import { HoverTool } from "./tools/HoverTool.ts";
import { EvaluateTool } from "./tools/EvaluateTool.ts";

// add other tool imports here

export class ToolRegistry {
  private tools: Map<string, AbstractTool> = new Map();

  constructor() {
    this.registerTool(new NavigateTool());
    this.registerTool(new ScreenshotTool());
    this.registerTool(new ClickTool());
    this.registerTool(new FillTool());
    this.registerTool(new SelectTool());
    this.registerTool(new HoverTool());
    this.registerTool(new EvaluateTool());
    // register other tools here
  }

  private registerTool(tool: AbstractTool) {
    this.tools.set(tool.name, tool);
  }

  public getTool(name: string): AbstractTool | undefined {
    return this.tools.get(name);
  }

  public getAllTools(): Tool[] {
    return Array.from(this.tools.values()).map(tool => tool.getToolDefinition());
  }
}