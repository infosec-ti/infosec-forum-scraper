import { Router } from "express";
import { ForumScraperController } from "../../../core/forum-scraper/forum-scraper.controller";
import { ForumScraperService } from "../../../core/forum-scraper/services/forum-scraper.service";
import { PuppeteerWrapper } from "../../puppeteer/puppeteer";

const router = Router();

const forumScraperController = new ForumScraperController(
  new ForumScraperService(new PuppeteerWrapper())
);

router.use(forumScraperController.router);

export default router;
