import { Node } from "./mal";

export type CacheType = "MAL_ANIME" | "ANI_ANIME" | "MAL_MANGA" | "ANI_MANGA"

export interface Cache {
	type: CacheType,
	updatedAt: Date,
	data: Array<Node>;
}
