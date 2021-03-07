import { existsSync, readFileSync, writeFileSync } from "fs";
import { CacheObject, CacheType } from "./types/cache";

const resolveCachePath = (type: CacheType) => {
	const base = `${__dirname}/../cache/`;

	switch (type) {
		case "ANI_ANIME":
			return base + "ani-animelist.json";
		case "ANI_MANGA":
			return base + "ani-mangalist.json";
		case "MAL_ANIME":
			return base + "mal-animelist.json";
		case "MAL_MANGA":
			return base + "mal-mangalist.json";
	}
};

export const writeCache = (...cache: CacheObject[]): void => {
	for (let obj of cache) {
		const path = resolveCachePath(obj.type);
		writeFileSync(path, JSON.stringify(obj), {
			encoding: "utf-8",
		});
	}
};

export const readCache = (type: CacheType): CacheObject | false => {
	const path = resolveCachePath(type);

	if (!existsSync(path)) return false;

	return JSON.parse(readFileSync(path, "utf-8"));
};
