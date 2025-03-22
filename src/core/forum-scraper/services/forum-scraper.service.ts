import { Page } from "puppeteer";
import { ConfigService, Env } from "../../../common/config/config.service";
import { PuppeteerWrapper } from "../../../domain/puppeteer/puppeteer";
import { Comment, Post } from "../../../domain/entities/post.entity";

export class ForumScraperService {
  constructor(private readonly puppeteer: PuppeteerWrapper) {}

  async handle(searchText: string) {
    await this.puppeteer.launchBrowser();
    await this.puppeteer.newPage(ConfigService.getVar(Env.FORUM_URL));

    const page = this.puppeteer.page;

    await page.waitForNavigation({ waitUntil: "domcontentloaded" });

    await this.login(page);

    await page.waitForNavigation({ waitUntil: "domcontentloaded" });

    await page.goto(`${ConfigService.getVar(Env.FORUM_URL)}/search/?type=post`);

    await this.search(page, searchText);

    await page.waitForNavigation({ waitUntil: "domcontentloaded" });

    const posts = await this.getPosts(page);

    await this.puppeteer.closeBrowser();

    return posts;
  }

  private async getPosts(page: Page) {
    const posts = await this.getPostContent(page);

    const PostWithComments: { post: Post; comments: Comment[] }[] = [];

    for (const post of posts) {
      await Promise.all([
        page.waitForNavigation({ waitUntil: "domcontentloaded" }),
        page.goto(post.url),
      ]);

      const totalComments = await this.getComments(page);

      const totalPages = await this.getTotalPages(page);

      for (let i = 2; i <= totalPages; i++) {
        const postComments = await this.getComments(page);

        totalComments.push(...postComments);

        await Promise.all([
          page.waitForNavigation({ waitUntil: "domcontentloaded" }),
          page.goto(`${post.url}page-${i}`),
        ]);
      }

      PostWithComments.push({ post, comments: totalComments });
    }

    return PostWithComments;
  }

  private async getPostContent(page: Page): Promise<Post[]> {
    const postsData = await page.evaluate(() => {
      const posts = Array.from(document.querySelectorAll("li.block-row"));

      return posts.map((li) => {
        const author = li.getAttribute("data-author") || "";
        const titleAnchor = li.querySelector("h3.contentRow-title a");
        const url = titleAnchor ? (titleAnchor as HTMLAnchorElement).href : "";
        const title = titleAnchor ? titleAnchor.textContent?.trim() || "" : "";
        const text =
          li.querySelector("div.contentRow-snippet")?.textContent?.trim() || "";
        const date = li.querySelector("time")?.getAttribute("datetime") || "";

        let replies = 0;
        const listItems = li.querySelectorAll("ul.listInline li");
        listItems.forEach((item) => {
          const itemText = item.textContent || "";
          if (itemText.includes("Replies:")) {
            const match = itemText.match(/Replies:\s*(\d+)/);
            if (match && match[1]) {
              replies = parseInt(match[1], 10);
            }
          }
        });

        let tags = "";
        if (titleAnchor) {
          const tagSpans = Array.from(
            titleAnchor.querySelectorAll("span")
          ).filter((span) => span.className.indexOf("prefix-") !== -1);
          if (tagSpans.length) {
            tags = `[${tagSpans
              .map((span) => span.textContent?.trim())
              .join("][")}]`;
          }
        }

        return { author, url, date, replies, title, text, tags };
      });
    });

    return postsData;
  }

  private async getTotalPages(page: Page) {
    return await page.evaluate(() => {
      const pageNav = document.querySelector(".pageNav-main");
      if (!pageNav) return 1;
      const lastPageLink = pageNav.querySelector("li:last-of-type a");
      return lastPageLink ? parseInt(lastPageLink.textContent!.trim(), 10) : 1;
    });
  }

  private async getComments(page: Page): Promise<Comment[]> {
    const comments = await page.evaluate(() => {
      const commentNodes = document.querySelectorAll(
        `article[itemtype="https://schema.org/Comment"]`
      );

      return Array.from(commentNodes).map((node) => {
        const authorElement = node.querySelector(".message-name a.username");
        const dateElement = node.querySelector("time");
        const contentElement = node.querySelector(".message-body");
        const urlElement = node.querySelector("a.message-attribution-gadget");

        return {
          author: authorElement ? authorElement.textContent!.trim() : null,
          date: dateElement ? dateElement.getAttribute("datetime") : null,
          text: contentElement ? contentElement.textContent!.trim() : null,
          url: urlElement ? (urlElement as HTMLAnchorElement).href : null,
        };
      });
    });

    return comments;
  }

  private async search(page: Page, searchText: string) {
    const searchXPath = `input[class="input"]`;

    await this.puppeteer.waitAndType(page, searchXPath, searchText);

    await page.evaluate(() => {
      const displayResultsAsThreadsXPath = `input[name="grouped"]`;
      const submitButtonXPath = `button[type="submit"]`;
      const onlyPostsXPath = 'input[name="order"]';

      const displayResultsAsThreads = document.querySelector(
        displayResultsAsThreadsXPath
      ) as HTMLInputElement;

      const radios = document.querySelectorAll(onlyPostsXPath);

      const submitButton = document.querySelector(
        submitButtonXPath
      ) as HTMLInputElement;

      (radios[1] as any).click();
      displayResultsAsThreads.click();
      submitButton.click();
    });
  }

  private async login(page: Page) {
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
