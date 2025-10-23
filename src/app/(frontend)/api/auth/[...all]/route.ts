import { toNextJsHandler } from "better-auth/next-js";
import { getServerSidePayloadAuth } from "@/lib/auth/server";

const payload = await getServerSidePayloadAuth();

export const { POST, GET } = toNextJsHandler(payload.betterAuth);
