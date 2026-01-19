"use client";

import { fetchPublicGenres } from "@/lib/services/genreService";
import { GENRES as FALLBACK_GENRES } from "@/lib/genres";

let cachedNames: string[] | null = null;
let inflight: Promise<string[]> | null = null;

export async function getActiveGenreNames() {
  if (cachedNames) return cachedNames;
  if (!inflight) {
    inflight = fetchPublicGenres()
      .then((genres) => {
        cachedNames = genres.filter((g) => g.isActive !== false).map((g) => g.name);
        return cachedNames.length ? cachedNames : FALLBACK_GENRES;
      })
      .catch(() => FALLBACK_GENRES)
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}
