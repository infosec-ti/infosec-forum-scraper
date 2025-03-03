import { Request, Response, Router } from "express";
import { ForumScraperService } from "./services/forum-scraper.service";

export class ForumScraperController {
  public router = Router();
  constructor(private readonly forumScraperService: ForumScraperService) {
    this.router.get("/forum-scraper/:searchText", this.handle.bind(this));
  }

  async handle(req: Request, res: Response) {
    try {
      const searchText = req.params.searchText;

      console.log(`Searching for: ${searchText}`);

      const result = await this.forumScraperService.handle(searchText);

      res.status(200).send({
        searchText: searchText,
        qtd_indicios: result.length,
        indicios: result,
      });
    } catch (err) {
      console.log(err);
      res.status(500).send({ error: "Error occurred while scraping." });
    }
  }
}
