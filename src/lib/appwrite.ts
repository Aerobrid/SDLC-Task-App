import "server-only";

import { cookies } from "next/headers";

import {
    Client,
    Account,
    Storage,
    Users,
    Databases,
} from "node-appwrite";

import { AUTH_COOKIE } from "@/features/auth/constants";

export async function createSessionClient(){
	const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
	const project = process.env.NEXT_PUBLIC_APPWRITE_PROJECT;

	if (!endpoint || !project) {
		throw new Error(
			`Appwrite Session Client configuration is missing: ` +
			`NEXT_PUBLIC_APPWRITE_ENDPOINT=${endpoint ? "set" : "missing"}, ` +
			`NEXT_PUBLIC_APPWRITE_PROJECT=${project ? "set" : "missing"}`
		);
	}

 	const client = new Client()
		.setEndpoint(endpoint)
		.setProject(project);

	const session = await cookies().get(AUTH_COOKIE);

	if (!session || !session.value) {
		throw new Error("Unauthorized");
	}

	client.setSession(session.value);

	return{
		get account() {
			return new Account(client);
		},
		get databases() {
			return new Databases(client);
		}
	};
};

// Function to create an Appwrite client for admin operations, connected to the Appwrite server
export async function createAdminClient() {
	const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
	const project = process.env.NEXT_PUBLIC_APPWRITE_PROJECT;
	const key = process.env.NEXT_APPWRITE_KEY;

	if (!endpoint || !project || !key) {
		throw new Error(
			`Appwrite Admin Client configuration is missing: ` +
			`NEXT_PUBLIC_APPWRITE_ENDPOINT=${endpoint ? "set" : "missing"}, ` +
			`NEXT_PUBLIC_APPWRITE_PROJECT=${project ? "set" : "missing"}, ` +
			`NEXT_APPWRITE_KEY=${key ? "set" : "missing"}`
		);
	}

	const client = new Client()
		.setEndpoint(endpoint)
		.setProject(project)
		.setKey(key);

	return{
		get account() {
			return new Account(client);
		},
		get users() {
			return new Users(client);
		},
		get databases() {
			return new Databases(client);
		},
		get storage() {
			return new Storage(client);
		}
	};
};