import { API } from "@/lib/api";

export interface GenreDto {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  displayOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateGenrePayload {
  name: string;
  description?: string;
  isActive?: boolean;
  displayOrder?: number | "";
}

export type UpdateGenrePayload = Partial<CreateGenrePayload>;

export async function fetchPublicGenres() {
  const res = await API.get<{ success: boolean; genres: GenreDto[] }>("/api/genres");
  return res.data.genres;
}

export async function fetchAdminGenres(includeInactive = true) {
  const res = await API.get<{ success: boolean; genres: GenreDto[] }>("/api/genres/admin", {
    params: { includeInactive },
  });
  return res.data.genres;
}

export async function createGenre(payload: CreateGenrePayload) {
  const res = await API.post<{ success: boolean; genre: GenreDto }>("/api/genres", payload);
  return res.data.genre;
}

export async function updateGenre(genreId: string, payload: UpdateGenrePayload) {
  const res = await API.put<{ success: boolean; genre: GenreDto }>(`/api/genres/${genreId}`, payload);
  return res.data.genre;
}

export async function deleteGenre(genreId: string) {
  await API.delete<{ success: boolean }>(`/api/genres/${genreId}`);
}
