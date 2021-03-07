import axios from "axios";
import { readFileSync, writeFileSync, existsSync } from "fs";
import readline from "readline";
import * as Cache from "../cache";
import { CacheData, CacheObject } from "../types/cache";
import { Node, Request, RequestType, Tokens } from "../types/mal";

const tokenFilePath = __dirname + "/../../config/tokens.json";

const toQueryString = (object: any) => {
	let querystring = "";
	const keys = Object.keys(object);

	for (let i = 0; i < keys.length; i++) {
		const key = keys[i];
		const value = object[key];

		querystring += `${key}=${value}`;

		if (i < keys.length - 1) {
			querystring += "&";
		}
	}
	return querystring;
};

function between(min: number, max: number): number {
	return Math.floor(Math.random() * (max - min) + min);
}

//#region Authentication
const config = require(__dirname + "/../../config/secrets.json");

const ClientID = config.myanimelist.ClientID;

const tempAuthHolder = {} as any;

function genPkceChallenge(): string {
	const alphabet =
		"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
	let gen = "";

	for (let i = 0; i < 128; i++) {
		gen += alphabet[between(0, alphabet.length - 1)];
	}

	return gen;
}

function getAuthUrl() {
	const verifier = genPkceChallenge();
	const challenge = verifier;

	tempAuthHolder["authentication"] = { verifier, challenge };

	return `https://myanimelist.net/v1/oauth2/authorize?response_type=code&client_id=${ClientID}&code_challenge=${challenge}&code_challenge_method=plain`;
}

async function tryRefresh(token: Tokens) {
	if (token.updatedAt < Date.now() + token.expires_in) return;

	const test = await axios.get("https://api.myanimelist.net/v2/users/@me", {
		headers: {
			Authorization: `Bearer ${token.access_token}`,
		},
	});

	if (test.status == 401) {
		await refreshTokens();
	}
}

async function generateAndSaveTokens(
	authorization_code: string
): Promise<void> {
	const url = "https://myanimelist.net/v1/oauth2/token";

	const options = {
		headers: {
			"content-type": "application/x-www-form-urlencoded",
			authorization: `Basic ${ClientID}`,
		},
	};

	const body = toQueryString({
		client_id: ClientID,
		grant_type: "authorization_code",
		code: authorization_code,
		code_verifier: tempAuthHolder["authentication"].verifier,
	});

	const res = await axios.post(url, body, options);
	const data = res.data;

	if (!data.access_token || data.access_token.length < 300) {
		console.log(data);
		throw new Error(data);
	}

	data["updatedAt"] = Date.now();

	writeFileSync(tokenFilePath, JSON.stringify(data));
}

export async function authenticate() {
	console.log(
		`Please visit this URL and get your authentication code: ${getAuthUrl()}\n\n`
	);

	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	console.log("Enter authentication code: ");

	const it = rl[Symbol.asyncIterator]();
	const authCode = await (await it.next()).value;
	rl.close();

	if (!authCode || authCode.length < 5) {
		console.log("Invalid authCode!.");
		return;
	}

	generateAndSaveTokens(authCode);
}

export async function refreshTokens(): Promise<void> {
	if (!existsSync(tokenFilePath)) {
		console.log("You need to generate a token first!.");
		return;
	}

	const url = "https://myanimelist.net/v1/oauth2/token";
	const token = JSON.parse(readFileSync(tokenFilePath, "utf8"));

	const options = {
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
			Authorization: "Basic " + ClientID,
		},
	};
	const body = toQueryString({
		client_id: ClientID,
		grant_type: "refresh_token",
		refresh_token: token.refresh_token,
	});

	const res = await axios.post(url, body, options);
	const data = await res.data;

	if (!data.access_token || data.access_token.length < 300) {
		console.log(data);
		throw new Error(token);
	}

	data["updatedAt"] = Date.now();

	writeFileSync(tokenFilePath, JSON.stringify(data));
}

//#endregion Authentication

//#region API

const getTokens = () => {
	return JSON.parse(readFileSync(tokenFilePath, "utf-8"));
};

const toNodeList = (type: "ANIME" | "MANGA", list: any[]): CacheData => {
	const construct = {
		total: 0,
		completed: 0,
		dropped: 0,
		hold: 0,
		plan: 0,
		inprogress: 0,
		elements: [] as Array<Node>,
	};

	let nlist: Array<Node> = [];
	for (let item of list) {
		const node = item.node;
		const status = item.list_status;

		construct.total++;

		if (status.status === "completed") {
			construct.completed++;
		}
		if (status.status === "dropped") {
			construct.dropped++;
		}
		if (status.status === "plan_to_watch" || status.status === "plan_to_read") {
			construct.plan++;
		}
		if (status.status === "on_hold") {
			construct.hold++;
		}
		if (status.status === "watching" || status.status === "reading") {
			construct.inprogress++;
		}


		let nodeItem: Node = {
			id: node.id,
			score: status.score,
			progress:
				type === "ANIME"
					? status.num_episodes_watched
					: status.num_volumes_read,
			status: status.status,
		};
		nlist.push(nodeItem);
	}

	construct.elements = nlist;
	return construct;
};

const getList = async (type: "ANIME" | "MANGA") => {
	const list = [];
	let response;
	let mapl: string;

	switch (type) {
		case "ANIME":
			mapl = "animelist";
			break;
		case "MANGA":
			mapl = "mangalist";
			break;
	}

	do {
		response = await sendRequest(
			`https://api.myanimelist.net/v2/users/@me/${mapl}?fields=list_status&limit=${1000}`,
			"GET"
		);
		list.push(...response.data);
	} while (response?.paging?.next);

	return list;
};

export const sendRequest = async (
	url: string,
	type: RequestType,
	data: any = {}
) => {
	const token = getTokens();
	await tryRefresh(token);

	const requestOptions: Request = {
		url: url,
		method: type,
		headers: {
			Authorization: `Bearer ${token.access_token}`,
			"content-type": "application/x-www-form-urlencoded",
		},
		data: toQueryString(data),
	};

	if (type == "GET" || type == "DELETE") delete requestOptions.data;

	const res = await axios.request(requestOptions);
	const resData = await res.data;

	if (res.status == 200) {
		return resData;
	} else {
		throw resData;
	}
};

export const getLists = async () => {
	const animelist = await getList("ANIME");
	const mangalist = await getList("MANGA");

	let anime = {
		type: "MAL_ANIME",
		updatedAt: new Date(),
		data: toNodeList("ANIME", animelist),
	} as CacheObject;
	let manga = {
		type: "MAL_MANGA",
		updatedAt: new Date(),
		data: toNodeList("MANGA", mangalist),
	} as CacheObject;

	Cache.writeCache(anime, manga);
};
//#endregion API
