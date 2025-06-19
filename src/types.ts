import { type LaunchOptions } from "puppeteer";

export interface BrowserManagerLaunchOptions {
  launchOptions?: LaunchOptions & { args?: string[] };
  allowDangerous?: boolean;
}