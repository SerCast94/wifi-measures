import apiClient from "@/core/lib/apiClient";
import { type Session, type SessionResponse } from "../types/session.types";

const VERSION = "v1";

export const getSession = async (): Promise<Session> => {
  const { data } = await apiClient.get<SessionResponse>(`${VERSION}/auth/me`);

  return data.data;
};
