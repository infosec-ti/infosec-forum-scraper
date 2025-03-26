import { Page, WaitForOptions } from "puppeteer";
import { ConfigService, Env } from "../../../common/config/config.service";
import { PuppeteerWrapper } from "../../../domain/puppeteer/puppeteer";
import { Comment, Post } from "../../../domain/entities/post.entity";
import { log, sleep } from "../../../common/utils/utils";
import { createError } from "../../../domain/server/middlewares/error-handler.middleware";
import { SearchTextDangerDto } from "../dtos/search-text-danger.dto";

const waitForNavigationOptions: WaitForOptions = {
  waitUntil: "domcontentloaded",
  timeout: 40000,
};

export class ForumScraperService {
  constructor(private readonly puppeteer: PuppeteerWrapper) {}

  async handle(searchText: string): Promise<SearchTextDangerDto[]> {
    try {
      await this.puppeteer.launchBrowser();
      await this.puppeteer.newPage(ConfigService.getVar(Env.FORUM_URL));

      const page = this.puppeteer.page;

      await page.waitForNavigation(waitForNavigationOptions).catch(() => {
        throw createError(
          "Failed to load the forum page",
          500,
          "NAVIGATION_FAILED"
        );
      });

      await this.login(page).catch((err) => {
        throw createError("Failed to login to the forum", 500, "LOGIN_FAILED");
      });

      await page.waitForNavigation(waitForNavigationOptions).catch(() => {
        throw createError(
          "Failed to navigate after login",
          500,
          "NAVIGATION_FAILED"
        );
      });

      await page
        .goto(`${ConfigService.getVar(Env.FORUM_URL)}/search/?type=post`)
        .catch(() => {
          throw createError(
            "Failed to navigate to search page",
            500,
            "NAVIGATION_FAILED"
          );
        });

      await this.search(page, searchText).catch(() => {
        throw createError("Failed to perform search", 500, "SEARCH_FAILED");
      });

      await sleep(5000);

      // await page
      //   .waitForNavigation({ waitUntil: "domcontentloaded", timeout: 20000 })
      //   .catch(() => {
      //     throw createError(
      //       "Failed to navigate after search",
      //       500,
      //       "NAVIGATION_FAILED"
      //     );
      //   });

      const posts = await this.getPosts(page).catch((err) => {
        throw createError(
          "Failed to retrieve posts",
          500,
          "DATA_RETRIEVAL_FAILED"
        );
      });

      await this.puppeteer.closeBrowser();

      return posts;
    } catch (err: any) {
      try {
        await this.puppeteer.closeBrowser();
      } catch {}

      if (err.status) throw err;

      throw createError(
        err.message || "Unable to scrape data",
        500,
        "SCRAPER_ERROR"
      );
    }
  }

  private async getPosts(page: Page): Promise<SearchTextDangerDto[]> {
    const posts = await this.getPostsContent(page);

    const PostWithComments: { post: Post; comments: Set<Comment> }[] = [];

    for (const post of posts) {
      try {
        log(`-- Getting comments for post: ${post.title} --`);
        await Promise.all([
          page.waitForNavigation(waitForNavigationOptions),
          page.goto(post.url),
        ]);

        const totalComments = await this.getComments(page);

        const totalPages = await this.getTotalPages(page);

        console.log(`- Total pages: ${totalPages}`);

        for (let i = 2; i <= totalPages; i++) {
          const postComments = await this.getComments(page);

          console.log("POST COMMENTS > ", postComments);

          log(`- Got ${postComments.size} comments for page ${i}`);

          postComments.forEach((comment) => totalComments.add(comment));

          await Promise.all([
            page.waitForNavigation(waitForNavigationOptions),
            page.goto(`${post.url}page-${i}`),
          ]);
        }

        PostWithComments.push({ post, comments: totalComments });
      } catch (err) {
        console.error(`Error getting comments for post: ${post.title}`);
        console.error(err);
      }
    }

    return PostWithComments.map((postWithComment) => ({
      post: postWithComment.post,
      comments: Array.from(postWithComment.comments),
    }));
  }

  private async getPostsContent(page: Page): Promise<Post[]> {
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

  private async getComments(page: Page): Promise<Set<Comment>> {
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

    return new Set(comments);
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

    const overlayErrorSelector = "div.overlay-title";
    const overlayErrorElement = await page
      .waitForSelector(overlayErrorSelector, { timeout: 3000 })
      .catch(() => null);

    if (overlayErrorElement) {
      const overlayText = await page.evaluate(
        (el) => el.textContent,
        overlayErrorElement
      );
      if (
        overlayText &&
        overlayText.includes("Oops! We ran into some problems.")
      ) {
        throw createError("Invalid searching text.", 400, "BAD_REQUEST");
      }
    }
  }

  private async login(page: Page) {
    try {
      const username = ConfigService.getVar(Env.FORUM_USERNAME);
      const password = ConfigService.getVar(Env.FORUM_PASSWORD);

      if (!username || !password) {
        throw createError(
          "Forum credentials not configured",
          500,
          "CREDENTIALS_MISSING"
        );
      }

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

          if (!usernameField || !passwordField) {
            throw new Error("Login form elements not found");
          }

          usernameField.value = username;
          passwordField.value = password;
        },
        username,
        password
      );

      await this.puppeteer.waitAndClick(page, loginButtonXPath);
    } catch (err: any) {
      throw createError(err.message || "Login failed", 500, "LOGIN_FAILED");
    }
  }
}
