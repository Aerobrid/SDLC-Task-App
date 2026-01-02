#!/usr/bin/env node
import { Client, Storage } from "node-appwrite";

function getEnv(name, alt) {
  return process.env[name] ?? (alt ? process.env[alt] : undefined);
}

const ENDPOINT = getEnv("NEXT_PUBLIC_APPWRITE_ENDPOINT", "APPWRITE_ENDPOINT");
const PROJECT = getEnv("NEXT_PUBLIC_APPWRITE_PROJECT", "APPWRITE_PROJECT");
const KEY = getEnv("NEXT_APPWRITE_KEY", "APPWRITE_KEY");
const BUCKET_ID = getEnv("NEXT_PUBLIC_APPWRITE_IMAGES_BUCKET_ID", "APPWRITE_IMAGES_BUCKET_ID");

if (!ENDPOINT || !PROJECT || !KEY || !BUCKET_ID) {
  console.error("Missing required Appwrite env vars. Set NEXT_PUBLIC_APPWRITE_ENDPOINT, NEXT_PUBLIC_APPWRITE_PROJECT, NEXT_APPWRITE_KEY, NEXT_PUBLIC_APPWRITE_IMAGES_BUCKET_ID.");
  process.exit(1);
}

const client = new Client();
client.setEndpoint(ENDPOINT).setProject(PROJECT).setKey(KEY);
const storage = new Storage(client);

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

async function listFiles() {
  console.log(`Listing files in bucket ${BUCKET_ID}...`);
  const res = await storage.listFiles(BUCKET_ID);
  const docs = res.files ?? res.documents ?? [];
  console.log(`Found ${docs.length} files:`);
  for (const f of docs) {
    console.log(`- id=${f.$id || f.id} name=${f.name || f.$id} size=${f.size || f.$size}`);
  }
}

async function getFile(id) {
  console.log(`Fetching file metadata for id=${id}...`);
  try {
    const f = await storage.getFile(BUCKET_ID, id);
    console.log(JSON.stringify(f, null, 2));
  } catch (err) {
    console.error('Error fetching file:', err instanceof Error ? err.message : String(err));
  }
}

async function main() {
  const args = parseArgs();
  const fileId = args.fileId || args.f;

  if (fileId) {
    await getFile(fileId);
  } else {
    await listFiles();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
