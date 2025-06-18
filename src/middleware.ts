import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { StatusCodes } from "http-status-codes";
import { isHttpError } from "http-errors";
import { statusCodeHandler } from "./errors/StatusCodeHandler";

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let status = StatusCodes.INTERNAL_SERVER_ERROR;
  let body: any = { message: "Internal Server Error" };

  if (err instanceof ZodError) {
    status = StatusCodes.BAD_REQUEST;
    body = err.errors.map((e) => ({
      path: e.path,
      message: e.message,
    }));
  } else if (isHttpError(err)) {
    status = err.status || StatusCodes.INTERNAL_SERVER_ERROR;
    body = { message: err.message };
  } else if (err instanceof Error) {
    status = statusCodeHandler(err);
    body = { message: err.message };
  } else {
    body = { message: "Unknown error" };
  }

  res.status(status).json(body);

  console.error(
    `[Error] ${req.method} ${req.originalUrl} - ${status} - ${
      err instanceof Error ? err.stack : err
    }`
  );

  next();
};
