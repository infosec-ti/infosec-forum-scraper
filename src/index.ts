import pup from "puppeteer";

const sleep = async (ms: number) => {
  console.log(`Sleeping for ${ms} ms`);
  return setTimeout(async () => await Promise.resolve(), ms);
};

(async () => {
  const browser = await pup.launch({
    headless: false,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  await page.goto("https://leakbase.io/");

  await page.waitForNavigation();

  await sleep(1000000);
})();
