#!/usr/bin/env node
import { Client, Databases, Query } from "node-appwrite";

function getEnv(name, alt) {
  return process.env[name] ?? (alt ? process.env[alt] : undefined);
}

const ENDPOINT = getEnv("NEXT_PUBLIC_APPWRITE_ENDPOINT", "APPWRITE_ENDPOINT");
const PROJECT = getEnv("NEXT_PUBLIC_APPWRITE_PROJECT", "APPWRITE_PROJECT");
const KEY = getEnv("NEXT_APPWRITE_KEY", "APPWRITE_KEY");
const DATABASE_ID = getEnv("NEXT_PUBLIC_APPWRITE_DATABASE_ID", "APPWRITE_DATABASE_ID");
const WORKSPACES_ID = getEnv("NEXT_PUBLIC_APPWRITE_WORKSPACES_ID", "APPWRITE_WORKSPACES_ID");
const PROJECTS_ID = getEnv("NEXT_PUBLIC_APPWRITE_PROJECTS_ID", "APPWRITE_PROJECTS_ID");

if (!ENDPOINT || !PROJECT || !KEY || !DATABASE_ID) {
  console.error("Missing required Appwrite env vars. Set NEXT_PUBLIC_APPWRITE_ENDPOINT, NEXT_PUBLIC_APPWRITE_PROJECT, NEXT_APPWRITE_KEY, NEXT_PUBLIC_APPWRITE_DATABASE_ID.");
  process.exit(1);
}

const client = new Client();
client.setEndpoint(ENDPOINT).setProject(PROJECT).setKey(KEY);
const databases = new Databases(client);

function parseArgs() {
  const args = {};
  for (const a of process.argv.slice(2)) {
    if (a.startsWith("--")) {
      const [k, v] = a.slice(2).split("=");
      args[k] = v ?? true;
    }
  }
  return args;
}

async function findInCollection(collectionId, term) {
  const res = await databases.listDocuments(DATABASE_ID, collectionId, []);
  const docs = res.documents ?? [];
  for (const d of docs) {
    const url = d.imageUrl || "";
    if (url.includes(term)) {
      console.log(`collection=${collectionId} id=${d.$id} imageUrl=${url}`);
    }
  }
}

async function main() {
  const args = parseArgs();
  const term = args.term || args.t || "mode=admin";

  console.log(`Searching for term: ${term}`);
  if (WORKSPACES_ID) await findInCollection(WORKSPACES_ID, term);
  if (PROJECTS_ID) await findInCollection(PROJECTS_ID, term);

  console.log("Done.");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
