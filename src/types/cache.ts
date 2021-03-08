import { Node } from "./mal";

export type CacheType = "MAL_ANIME" | "ANI_ANIME" | "MAL_MANGA" | "ANI_MANGA";

export interface Meta {
	total: number;
	completed: number;
	dropped: number;
	hold: number;
	plan: number;
	inprogress: number;
}

export interface CacheData {
	meta: Meta;
	list: Node[];
}

export interface CacheObject {
	type: CacheType;
	updatedAt: Date;
	data: CacheData;
}
