import "express";

declare module "express" {
  interface Request {
    session: session.Session &
      Partial<session.SessionData> & { userId?: string };
  }
}
