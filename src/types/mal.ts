export type RequestType = "POST" | "GET" | "PUT" | "DELETE";

export interface Tokens {
	token_type: string;
	expires_in: number;
	access_token: string;
	refresh_token: string;
	updatedAt: number;
}

export interface Request {
	url: string;
	method: RequestType;
	headers: any;
	data?: string;
}

export interface Node {
	id: number | null;
	score: number;
	status: string;
	progress: number;
}
