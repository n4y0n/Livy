import axios from "axios";
import * as fs from "fs";
import readline from "readline";

const config = require(__dirname + "/../../config/secrets.json");

const ClientID = config.myanimelist.ClientID;
const tokenFilePath = __dirname + "/../../config/tokens.json";

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

function between(min: number, max: number): number {
	return Math.floor(Math.random() * (max - min) + min);
}

function getAuthUrl() {
	const verifier = genPkceChallenge();
	const challenge = verifier;

	tempAuthHolder["authentication"] = { verifier, challenge };

	return `https://myanimelist.net/v1/oauth2/authorize?response_type=code&client_id=${ClientID}&code_challenge=${challenge}&code_challenge_method=plain`;
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

	const body = `client_id=${ClientID}&grant_type=authorization_code&code=${authorization_code}&code_verifier=${tempAuthHolder["authentication"].verifier}`;

	const res = await axios.post(url, body, options);
	const data = res.data;

	if (!data.access_token || data.access_token.length < 300) {
		console.log(data);
		throw new Error(data);
	}

	fs.writeFileSync(tokenFilePath, JSON.stringify(data));
}

export async function authenticate() {
	console.log(`Please visit this URL and get your authentication code: ${getAuthUrl()}\n\n`);

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

	generateAndSaveTokens(authCode)
}

export async function refreshTokens(): Promise<void> {
	if (!fs.existsSync(tokenFilePath)) {
		console.log("You need to generate a token first!.");
		return;
	}

	const url = "https://myanimelist.net/v1/oauth2/token";
	const token = JSON.parse(fs.readFileSync(tokenFilePath, "utf8"));

	const options = {
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
			Authorization: "Basic " + ClientID,
		},
	};
	const body = `client_id=${ClientID}&grant_type=refresh_token&refresh_token=${token.refresh_token}`;

	const res = await axios.post(url, body, options)
	const data = await res.data;

	if (!data.access_token || data.access_token.length < 300) {
		console.log(data);
		throw new Error(token);
	}

	fs.writeFileSync(tokenFilePath, JSON.stringify(data));
}
