import { hc } from "hono/client";

import { AppType } from "@/app/api/[[...route]]/route";

// `hc` does not export precise TypeScript types we can rely on here in this repo.
// We temporarily allow an explicit `any` for `client` to keep existing call
// sites compiling; narrow this type later when a proper Hono client type is
// available.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const client: any = hc<AppType>(process.env.NEXT_PUBLIC_APP_URL!);