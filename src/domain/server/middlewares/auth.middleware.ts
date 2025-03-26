import { Request, Response, NextFunction } from "express";
import { ConfigService, Env } from "../../../common/config/config.service";

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization;

  if (token === ConfigService.getVar(Env.AUTH_TOKEN)) {
    return next();
  }

  res.status(401).send("Unauthorized");
};
