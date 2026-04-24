// Navigation
export type Page = "home" | "dashboard" | "auth" | "detail" | "profile";

// navigate("detail", 123) — comicId wajib kalau ke detail
export type NavigateFn = (page: Page, comicId?: number | string) => void;

// AniList Types
export interface StaffEdge {
  role: string;
  node: { name: { full: string } };
}

export interface Comic {
  id: number;
  title: { romaji: string; english: string | null };
  coverImage: { large: string };
  averageScore: number | null;
  countryOfOrigin: string;
  description: string | null;
  staff: { edges: StaffEdge[] };
}

export interface ComicDetail extends Comic {
  coverImage: { large: string; extraLarge: string };
  status: string | null;
  genres: string[];
}

export type TabId = "trending" | "topRated" | "newManhwa" | "popularManga";
export interface Tab {
  id: TabId;
  label: string;
}

// Supabase Types
export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
}

export interface Comment {
  id: string;
  content: string;
  created_at: string;

  parent_id?: string | null;

  profiles: {
    id: string;
    username: string;
    avatar_url: string | null;
  };

  like_count?: number;
}

export interface RatingRow {
  score: number;
}
