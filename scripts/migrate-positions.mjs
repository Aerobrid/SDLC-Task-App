#!/usr/bin/env node
import { Client, Databases, Query } from "node-appwrite";

const STATUS_ORDER = ["backlog", "todo", "in-progress", "in-review", "done"];

function getEnv(name, alt) {
  return process.env[name] ?? (alt ? process.env[alt] : undefined);
}

const ENDPOINT = getEnv("NEXT_PUBLIC_APPWRITE_ENDPOINT", "APPWRITE_ENDPOINT");
const PROJECT = getEnv("NEXT_PUBLIC_APPWRITE_PROJECT", "APPWRITE_PROJECT");
const KEY = getEnv("NEXT_APPWRITE_KEY", "APPWRITE_KEY");
const DATABASE_ID = getEnv("NEXT_PUBLIC_APPWRITE_DATABASE_ID", "APPWRITE_DATABASE_ID");
const TASKS_ID = getEnv("NEXT_PUBLIC_APPWRITE_TASKS_ID", "APPWRITE_TASKS_ID");
const WORKSPACES_ID = getEnv("NEXT_PUBLIC_APPWRITE_WORKSPACES_ID", "APPWRITE_WORKSPACES_ID");

if (!ENDPOINT || !PROJECT || !KEY || !DATABASE_ID || !TASKS_ID) {
  console.error("Missing required Appwrite env vars. Set NEXT_PUBLIC_APPWRITE_ENDPOINT, NEXT_PUBLIC_APPWRITE_PROJECT, NEXT_APPWRITE_KEY, NEXT_PUBLIC_APPWRITE_DATABASE_ID, and NEXT_PUBLIC_APPWRITE_TASKS_ID.");
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

async function listWorkspaces() {
  if (!WORKSPACES_ID) {
    throw new Error("WORKSPACES_ID not set; cannot list workspaces. Provide --workspaceId or set NEXT_PUBLIC_APPWRITE_WORKSPACES_ID.");
  }
  const res = await databases.listDocuments(DATABASE_ID, WORKSPACES_ID, []);
  return (res.documents ?? []).map(d => d.$id);
}

async function migrateWorkspace(workspaceId) {
  console.log(`Migrating workspace ${workspaceId}`);
  for (const status of STATUS_ORDER) {
    const queries = [Query.equal("workspaceId", String(workspaceId)), Query.equal("status", String(status)), Query.orderAsc("$createdAt")];
    const res = await databases.listDocuments(DATABASE_ID, TASKS_ID, queries);
    const docs = (res.documents ?? []);
    console.log(`  Found ${docs.length} tasks in status ${status}`);
    for (let i = 0; i < docs.length; i++) {
      const d = docs[i];
      try {
        await databases.updateDocument(DATABASE_ID, TASKS_ID, d.$id, { position: i });
        process.stdout.write(".");
      } catch (err) {
        process.stdout.write("E");
        console.error(`\nFailed to update ${d.$id}:`, err instanceof Error ? err.message : String(err));
      }
    }
    process.stdout.write("\n");
  }
}

async function main() {
  const args = parseArgs();
  const workspaceId = args.workspaceId;
  const all = args.all;

  if (!workspaceId && !all) {
    console.error("Usage: migrate-positions.mjs --workspaceId=ID or --all");
    process.exit(1);
  }

  const workspaces = workspaceId ? [workspaceId] : await listWorkspaces();

  for (const w of workspaces) {
    await migrateWorkspace(w);
  }

  console.log("Done.");
}

main().catch(err => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
