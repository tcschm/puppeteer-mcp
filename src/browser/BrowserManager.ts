import puppeteer, { Browser, Page, PuppeteerLaunchOptions } from "puppeteer";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { deepMerge } from "../utils/deepMerge.js";
import { BrowserManagerLaunchOptions } from "../types.js";

const DANGEROUS_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--single-process',
  '--disable-web-security',
  '--ignore-certificate-errors',
  '--disable-features=IsolateOrigins',
  '--disable-site-isolation-trials',
  '--allow-running-insecure-content'
];

export class BrowserManager {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private consoleLogs: string[] = [];
  private previousLaunchOptions: string | null = null;
  private server: Server<any, any>;

  constructor(server: Server<any, any>) {
    this.server = server;
  }

  private parseEnvLaunchOptions(): PuppeteerLaunchOptions {
    try {
      return JSON.parse(process.env.PUPPETEER_LAUNCH_OPTIONS || '{}');
    } catch (error: any) {
      console.warn('Failed to parse PUPPETEER_LAUNCH_OPTIONS:', error?.message || error);
      return {};
    }
  }

  public async ensureBrowserAndPage(options: BrowserManagerLaunchOptions): Promise<Page> {
    const { launchOptions, allowDangerous } = options;
    const envConfig = this.parseEnvLaunchOptions();
    const mergedUserConfig = deepMerge(envConfig, launchOptions || {});

    // security validation for merged config
    if (mergedUserConfig?.args && Array.isArray(mergedUserConfig.args)) {
      const dangerousArgsUsed = mergedUserConfig.args.filter((arg: string) =>
        DANGEROUS_ARGS.some(dangerousArg => arg.startsWith(dangerousArg))
      );
      if (dangerousArgsUsed.length > 0 && !(allowDangerous || (process.env.ALLOW_DANGEROUS === 'true'))) {
        throw new Error(
          `Dangerous browser arguments detected: ${dangerousArgsUsed.join(', ')}. ` +
          'Set allowDangerous: true in the tool call arguments or ALLOW_DANGEROUS=true in environment to override.'
        );
      }
    }

    const currentLaunchOptionsString = JSON.stringify(mergedUserConfig);

    try {
      if (this.browser && (!this.browser.connected || currentLaunchOptionsString !== this.previousLaunchOptions)) {
        await this.browser.close();
        this.browser = null;
        this.page = null;
      }
    } catch (error) {
      console.error("Error while trying to close existing browser:", error);
      this.browser = null;
      this.page = null;
    }

    this.previousLaunchOptions = currentLaunchOptionsString;

    if (!this.browser || !this.page) {
      const defaultArgs = process.env.DOCKER_CONTAINER
        ? { headless: true, args: ["--no-sandbox", "--single-process", "--no-zygote"] }
        : { headless: false };

      const finalLaunchOptions = deepMerge(defaultArgs, mergedUserConfig);

      this.browser = await puppeteer.launch(finalLaunchOptions);
      const pages = await this.browser.pages();
      this.page = pages[0] || await this.browser.newPage(); // ensure a page exists

      this.page.on("console", (msg) => {
        const logEntry = `[${msg.type()}] ${msg.text()}`;
        this.consoleLogs.push(logEntry);
        this.server.notification({
          method: "notifications/resources/updated",
          params: { uri: "console://logs" },
        });
      });
    }
    return this.page!;
  }

  public getConsoleLogs(): string[] {
    return this.consoleLogs;
  }

  public async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }
}