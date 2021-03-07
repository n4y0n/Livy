import { Node } from "./mal";

export type CacheType = "MAL_ANIME" | "ANI_ANIME" | "MAL_MANGA" | "ANI_MANGA";

export interface CacheData {
	total: number;
	completed: number;
	dropped: number;
	hold: number;
	plan: number;
	inprogress: number;
	elements: Node[];
}

export interface CacheObject {
	type: CacheType;
	updatedAt: Date;
	data: CacheData;
}
