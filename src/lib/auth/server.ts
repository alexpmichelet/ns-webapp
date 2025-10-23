import configPromise from "@payload-config";
import { getPayloadAuth } from "payload-auth/better-auth";

export const getServerSidePayloadAuth = async () =>
  getPayloadAuth(configPromise);
