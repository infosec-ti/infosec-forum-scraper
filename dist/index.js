"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const puppeteer_1 = __importDefault(require("puppeteer"));
const sleep = async (ms) => {
    console.log(`Sleeping for ${ms} ms`);
    return setTimeout(async () => await Promise.resolve(), ms);
};
(async () => {
    const browser = await puppeteer_1.default.launch({
        headless: false,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.goto("https://leakbase.io/");
    await page.waitForNavigation();
    await sleep(1000000);
})();
