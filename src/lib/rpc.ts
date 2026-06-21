import { hc } from "hono/client";

import { AppType } from "@/app/api/[[...route]]/route";

// `hc` does not export precise TypeScript types we can rely on here in this repo.
// We temporarily allow an explicit `any` for `client` to keep existing call
// sites compiling; narrow this type later when a proper Hono client type is
// available.
const getAppUrl = () => {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  }
  return "http://localhost:3000";
};

export const client: any = hc<AppType>(getAppUrl());