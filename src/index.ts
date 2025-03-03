import pup, { KeyInput, Page } from "puppeteer";
import { ConfigService, Env } from "./common/config/config.service";

const sleep = async (ms: number) => {
  console.log(`Sleeping for ${ms} ms`);
  return setTimeout(async () => await Promise.resolve(), ms);
};

const configService = new ConfigService();

(async () => {
  const browser = await pup.launch({
    headless: false,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    defaultViewport: { height: 1080, width: 1920 },
  });

  const page = await browser.newPage();

  await page.goto(configService.getVar(Env.FORUM_URL));

  await page.waitForNavigation({
    waitUntil: "domcontentloaded",
  });

  console.log("Carregou");

  await login(page);

  await page.waitForNavigation({
    waitUntil: "domcontentloaded",
  });

  await search(page, "duolingo");

  await page.waitForNavigation({
    waitUntil: "domcontentloaded",
  });

  const posts = await getPosts(page);

  console.log(posts);

  await sleep(1000000);
})();

async function getPosts(page: Page) {
  const posts = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("ol.block-body > li")).map(
      (li) => {
        const titleElement = li.querySelector<HTMLAnchorElement>(
          ".contentRow-title a"
        );
        const repliesElement = Array.from(
          li.querySelectorAll<HTMLLIElement>(".contentRow-minor li")
        ).find((el) => el.innerText.includes("Replies:"));
        const timeElement = li.querySelector<HTMLTimeElement>("time");

        return {
          title: titleElement?.innerText.trim() ?? "",
          replies: repliesElement
            ? parseInt(repliesElement.innerText.replace("Replies: ", ""), 10)
            : 0,
          date: timeElement?.dateTime ?? "",
          author: li.getAttribute("data-author") ?? "",
          url: titleElement?.href ?? "",
        };
      }
    );
  });

  return posts;
}

async function search(page: Page, searchText: string) {
  const searchXPath = `input[name="keywords"]`;

  await waitAndType(page, searchXPath, searchText);
  await focusAndPress(page, searchXPath, "Enter");
}

async function login(page: Page) {
  const username = configService.getVar(Env.FORUM_USERNAME);
  const password = configService.getVar(Env.FORUM_PASSWORD);

  const loginXPath = `a[class='button--secondary button']`;

  const loginButtonXPath = `button[class="button--primary button button--icon button--icon--login"]`;

  await waitAndClick(page, loginXPath);

  await page.waitForSelector('div[class="overlay-container is-active"]');

  await page.evaluate(
    (username, password) => {
      const usernameXPath = `input[name="login"]`;
      const passwordXPath = `input[name="password"]`;

      const usernameField = document.querySelector(
        usernameXPath
      ) as HTMLInputElement;
      const passwordField = document.querySelector(
        passwordXPath
      ) as HTMLInputElement;

      usernameField.value = username;
      passwordField.value = password;
    },
    username,
    password
  );

  await waitAndClick(page, loginButtonXPath);
}

async function waitAndClick(page: Page, selector: string) {
  console.log("waiting for ", selector);
  await page.waitForSelector(selector);
  await page.click(selector);
}

async function waitAndType(page: Page, selector: string, text: string) {
  console.log("waiting for ", selector);
  await page.waitForSelector(selector);
  await page.type(selector, text);
}

async function focusAndPress(page: Page, selector: string, key: KeyInput) {
  await page.focus(selector);
  await page.keyboard.press(key);
}
