import { Page } from "puppeteer";
import { ConfigService, Env } from "../../../common/config/config.service";
import { PuppeteerWrapper } from "../../../domain/puppeteer/puppeteer";
import { Post } from "../../../domain/entities/post.entity";

export class ForumScraperService {
  constructor(private readonly puppeteer: PuppeteerWrapper) {}

  async handle(searchText: string) {
    await this.puppeteer.launchBrowser();
    await this.puppeteer.newPage(ConfigService.getVar(Env.FORUM_URL));

    const page = this.puppeteer.page;

    await page.waitForNavigation({ waitUntil: "domcontentloaded" });

    await this.login(page);

    await page.waitForNavigation({ waitUntil: "domcontentloaded" });

    await this.search(page, searchText);

    await page.waitForNavigation({ waitUntil: "domcontentloaded" });

    const posts = await this.getPosts(page);

    await this.puppeteer.closeBrowser();

    return posts;
  }

  async getPosts(page: Page) {
    const result = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("ol.block-body > li")).map(
        (li) => {
          const titleElement = li.querySelector<HTMLAnchorElement>(
            ".contentRow-title a"
          );
          const repliesElement = Array.from(
            li.querySelectorAll<HTMLLIElement>(".contentRow-minor li")
          ).find((el) => el.innerText.includes("Replies:"));
          const timeElement = li.querySelector<HTMLTimeElement>("time");
          const snippetElement = li.querySelector<HTMLTimeElement>(
            ".contentRow-snippet"
          );

          return {
            title: titleElement?.innerText.trim() ?? "",
            replies: repliesElement
              ? parseInt(repliesElement.innerText.replace("Replies: ", ""), 10)
              : 0,
            date: timeElement?.dateTime ?? "",
            author: li.getAttribute("data-author") ?? "",
            url: titleElement?.href ?? "",
            type: titleElement?.href?.includes("post-") ? "comment" : "post",
            text: snippetElement?.innerText.trim() ?? "",
          };
        }
      );
    });

    const { posts, comments } = result.reduce(
      (acc, result) => {
        if (result.type === "post") {
          acc.posts.push({
            ...result,
            evidences: [],
          });
        } else {
          acc.comments.push(result);
        }

        return acc;
      },
      { posts: [], comments: [] } as any
    );

    for (const comment of comments) {
      const post = posts.find((post: Post) => comment.url.startsWith(post.url));
      if (post) {
        const { replies, title, type, ...rest } = comment;

        post.evidences.push(rest);
      }
    }

    return posts;
  }

  async search(page: Page, searchText: string) {
    const searchXPath = `input[name="keywords"]`;

    await this.puppeteer.waitAndType(page, searchXPath, searchText);
    await this.puppeteer.focusAndPress(page, searchXPath, "Enter");
  }

  async login(page: Page) {
    const username = ConfigService.getVar(Env.FORUM_USERNAME);
    const password = ConfigService.getVar(Env.FORUM_PASSWORD);

    const loginXPath = `a[class='button--secondary button']`;

    const loginButtonXPath = `button[class="button--primary button button--icon button--icon--login"]`;

    await this.puppeteer.waitAndClick(page, loginXPath);

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

    await this.puppeteer.waitAndClick(page, loginButtonXPath);
  }
}
