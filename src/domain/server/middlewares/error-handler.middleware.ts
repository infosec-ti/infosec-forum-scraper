import { Request, Response, NextFunction } from "express";

export interface HttpError extends Error {
  status?: number;
  code?: string;
}

export function createError(
  message: string,
  status = 500,
  code?: string
): HttpError {
  const error: HttpError = new Error(message);
  error.status = status;
  if (code) error.code = code;
  return error;
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((err) => {
      console.error("Error caught by asyncHandler:", err);

      const status = err.status || 500;
      const message = err.message || "Internal Server Error";
      const code = err.code || "INTERNAL_SERVER_ERROR";

      res.status(status).json({
        error: true,
        message,
        code,
        status,
      });
    });
  };
}

export function errorMiddleware(
  err: HttpError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const status = err.status || 500;
  const message = err.message || "Internal Server Error";
  const code = err.code || "INTERNAL_SERVER_ERROR";

  console.error(`[Error] ${code} (${status}): ${message}`);

  res.status(status).json({
    error: true,
    message,
    code,
    status,
  });
}
