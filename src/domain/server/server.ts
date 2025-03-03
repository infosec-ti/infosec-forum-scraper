import express, { Application } from "express";
import { authMiddleware } from "./middlewares/auth.middleware";
import router from "./routes/main.router";

export class Server {
  public app: Application;

  constructor() {
    this.app = express();
    this.cors();
    this.middlewares();
    this.routes();
  }

  private middlewares() {
    this.app.use(authMiddleware);
    this.app.use(express.json());
  }

  private routes() {
    this.app.use(router);
  }

  private cors() {
    this.app.use((req, res, next) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader(
        "Access-Control-Allow-Methods",
        "POST, GET, PUT, DELETE, PATCH"
      );
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");
      next();
    });
  }
}

export default new Server().app;
