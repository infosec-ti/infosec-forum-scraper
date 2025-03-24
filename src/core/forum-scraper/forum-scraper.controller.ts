import { Request, Response, Router } from "express";
import { ForumScraperService } from "./services/forum-scraper.service";
import {
  asyncHandler,
  createError,
} from "../../domain/server/middlewares/error-handler.middleware";

export class ForumScraperController {
  public router = Router();
  constructor(private readonly forumScraperService: ForumScraperService) {
    this.router.get(
      "/forum-scraper/:searchText",
      asyncHandler(this.handle.bind(this))
    );
  }

  async handle(req: Request, res: Response) {
    const searchText = req.params.searchText;

    if (!searchText || searchText.trim().length < 3) {
      throw createError(
        "Search text must be at least 3 characters long",
        400,
        "INVALID_SEARCH_TEXT"
      );
    }

    console.log(`Searching for: ${searchText}`);

    const result = await this.forumScraperService.handle(searchText);

    res.status(200).send({
      search_text: searchText,
      danger_quantity: result.length,
      dangers: result,
    });
  }
}
