// hono for code-based routing (web framework for Node.js)
// this allows routes to be defined in a modular way rather than just using file-based routing with Next.js
import { Hono } from "hono";
// handle is a function from hono that allows you to handle requests
import { handle } from "hono/vercel";

// importing auth file which contains the authentication routes
import auth from "@/features/auth/server/route";
import workspaces from "@/features/workspaces/server/route";
import members from "@/features/members/server/route";
import projects from "@/features/projects/server/route";

// creating a new Hono application instance with a base path of /api
const app = new Hono().basePath("/api");

// defining the /auth route and attaching the auth routes to it
const routes = app
  .route("/auth", auth)
  .route("/workspaces", workspaces)
  .route("/members", members)
  .route("/projects", projects);

// defining the GET route for the application
export const GET = handle(app);
// defining the POST route for the application
export const POST = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);

// Exporting the routes type for use in other parts of the application
export type AppType = typeof routes;