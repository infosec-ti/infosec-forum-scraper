import { Browser, Page } from "puppeteer";
import puppeteer, { KeyInput } from "puppeteer";

export class PuppeteerWrapper {
  private browser: Browser | null = null;
  private _page: Page | null = null;

  async launchBrowser(): Promise<void> {
    if (this.browser) {
      throw new Error("Browser already launched");
    }

    this.browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      defaultViewport: { height: 1080, width: 1920 },
    });
  }

  async newPage(url?: string): Promise<void> {
    if (!this.browser) {
      throw new Error("Browser not launched");
    }
    this._page = await this.browser.newPage();

    if (process.argv.includes("verbose2")) {
      this._page.on("console", (msg) => {
        console.log("PAGE LOG:", msg.text());
      });
    }

    if (url) {
      await this._page.goto(url);
    }
  }

  public get page(): Page {
    if (!this._page) {
      throw new Error("Page not created. Call newPage() first.");
    }
    return this._page;
  }

  async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async waitAndClick(page: Page, selector: string) {
    await page.waitForSelector(selector);
    await page.click(selector);
  }

  async waitAndType(page: Page, selector: string, text: string) {
    await page.waitForSelector(selector);
    await page.type(selector, text);
  }

  async focusAndPress(page: Page, selector: string, key: KeyInput) {
    await page.focus(selector);
    await page.keyboard.press(key);
  }
}
