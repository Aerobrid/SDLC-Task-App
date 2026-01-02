#!/usr/bin/env node
import { Client, Databases } from "node-appwrite";

function getEnv(name, alt) {
  return process.env[name] ?? (alt ? process.env[alt] : undefined);
}

const ENDPOINT = getEnv("NEXT_PUBLIC_APPWRITE_ENDPOINT", "APPWRITE_ENDPOINT");
const PROJECT = getEnv("NEXT_PUBLIC_APPWRITE_PROJECT", "APPWRITE_PROJECT");
const KEY = getEnv("NEXT_APPWRITE_KEY", "APPWRITE_KEY");
const DATABASE_ID = getEnv("NEXT_PUBLIC_APPWRITE_DATABASE_ID", "APPWRITE_DATABASE_ID");
const WORKSPACES_ID = getEnv("NEXT_PUBLIC_APPWRITE_WORKSPACES_ID", "APPWRITE_WORKSPACES_ID");
const PROJECTS_ID = getEnv("NEXT_PUBLIC_APPWRITE_PROJECTS_ID", "APPWRITE_PROJECTS_ID");
const IMAGES_BUCKET_ID = getEnv("NEXT_PUBLIC_APPWRITE_IMAGES_BUCKET_ID", "APPWRITE_IMAGES_BUCKET_ID");

if (!ENDPOINT || !PROJECT || !KEY || !DATABASE_ID || !IMAGES_BUCKET_ID) {
  console.error("Missing required Appwrite env vars. Set NEXT_PUBLIC_APPWRITE_ENDPOINT, NEXT_PUBLIC_APPWRITE_PROJECT, NEXT_APPWRITE_KEY, NEXT_PUBLIC_APPWRITE_DATABASE_ID, and NEXT_PUBLIC_APPWRITE_IMAGES_BUCKET_ID.");
  process.exit(1);
}

const client = new Client();
client.setEndpoint(ENDPOINT).setProject(PROJECT).setKey(KEY);
const databases = new Databases(client);

function cleanEndpoint(e) {
  return e.replace(/\/v1$/, "");
}

function publicViewUrl(endpoint, bucketId, fileId, project) {
  const ep = cleanEndpoint(endpoint);
  return `${ep}/v1/storage/buckets/${bucketId}/files/${fileId}/view?project=${project}`;
}

async function updateCollection(collectionId, idField = "imageId") {
  if (!collectionId) return;
  console.log(`Processing collection ${collectionId}`);
  const res = await databases.listDocuments(DATABASE_ID, collectionId, []);
  const docs = res.documents ?? [];
  console.log(`  Found ${docs.length} documents`);

  for (const d of docs) {
    const imageId = d[idField];
    const current = d.imageUrl;
    let newUrl = current;

    if (imageId) {
      newUrl = publicViewUrl(ENDPOINT, IMAGES_BUCKET_ID, imageId, PROJECT);
    } else if (typeof current === "string" && current.includes("mode=admin")) {
      newUrl = current.replace(/([&?])mode=admin(&?)/, (m, p1, p2) => (p1 === "?" ? (p2 ? "?" : "") : (p2 ? "&" : ""))).replace(/\?$/, "");
    }

    if (newUrl && newUrl !== current) {
      try {
        await databases.updateDocument(DATABASE_ID, collectionId, d.$id, { imageUrl: newUrl });
        process.stdout.write(".");
      } catch (err) {
        process.stdout.write("E");
        console.error(`\nFailed to update ${d.$id}:`, err instanceof Error ? err.message : String(err));
      }
    }
  }
  process.stdout.write("\n");
}

async function main() {
  console.log("Updating imageUrl fields to public view URLs...");
  await updateCollection(WORKSPACES_ID, "imageId");
  await updateCollection(PROJECTS_ID, "imageId");
  console.log("Done.");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
