import { LRUCache } from "lru-cache";
import dotenv from "dotenv";

dotenv.config();

const maxSize = parseInt(process.env.CACHE_MAX_SIZE || "500");

export const urlCache = new LRUCache<string, any>({
  max: maxSize,
});
