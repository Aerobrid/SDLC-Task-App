import { hc } from "hono/client";

import { AppType } from "@/app/api/[[...route]]/route";

// `hc` does not export precise TypeScript types we can rely on here in this repo,
// so cast to `any` to make the rest of the codebase type-check while keeping
// the runtime behavior intact. If you want stricter types, replace `any`
// with a proper `HcClient` type from `hono` when available.
export const client: any = hc<AppType>(process.env.NEXT_PUBLIC_APP_URL!);