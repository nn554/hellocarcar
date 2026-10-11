import type { Request } from "express";
import type { SessionUser } from "@hellocarcar/contracts";

export type AuthenticatedRequest = Request & {
  user: SessionUser;
  sessionId: string;
};
