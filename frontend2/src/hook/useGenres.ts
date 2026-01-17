"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { NormalizedError } from "@/lib/errors";
import { toNormalizedError } from "@/lib/errors";
import { GENRES as FALLBACK_GENRES } from "@/lib/genres";
import {
  fetchAdminGenres,
  fetchPublicGenres,
  type GenreDto,
  type CreateGenrePayload,
  type UpdateGenrePayload,
  createGenre,
  updateGenre,
  deleteGenre as deleteGenreApi,
} from "@/lib/services/genreService";

interface UseGenresOptions {
  includeInactive?: boolean;
  admin?: boolean;
  enabled?: boolean;
}

export function useGenres(options: UseGenresOptions = {}) {
  const { includeInactive = false, admin = false, enabled = true } = options;
  const [genres, setGenres] = useState<GenreDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<NormalizedError | null>(null);

  const loadGenres = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const data = admin ? await fetchAdminGenres(includeInactive) : await fetchPublicGenres();
      setGenres(data);
    } catch (err) {
      setError(toNormalizedError(err));
      setGenres([]);
    } finally {
      setLoading(false);
    }
  }, [admin, includeInactive, enabled]);

  useEffect(() => {
    void loadGenres();
  }, [loadGenres]);

  const names = useMemo(() => {
    if (genres.length) {
      return genres.filter((g) => g.isActive !== false).map((g) => g.name);
    }
    return FALLBACK_GENRES;
  }, [genres]);

  return {
    genres,
    names,
    loading,
    error,
    refresh: loadGenres,
    createGenre: async (payload: CreateGenrePayload) => {
      const created = await createGenre(payload);
      setGenres((prev) => [...prev, created]);
      return created;
    },
    updateGenre: async (id: string, payload: UpdateGenrePayload) => {
      const updated = await updateGenre(id, payload);
      setGenres((prev) => prev.map((g) => (g._id === id ? updated : g)));
      return updated;
    },
    deleteGenre: async (id: string) => {
      await deleteGenreApi(id);
      setGenres((prev) => prev.filter((g) => g._id !== id));
    },
  };
}

export type { GenreDto };
