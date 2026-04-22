// Navigation

export type Page = "home" | "dashboard" | "auth";
export type NavigateFn = (page: Page) => void;

// AniList Data Types

export interface StaffEdge {
  role: string;
  node: {
    name: { full: string };
  };
}

export interface Comic {
  id: number;
  title: {
    romaji: string;
    english: string | null;
  };
  coverImage: {
    large: string;
  };
  averageScore: number | null;
  countryOfOrigin: string;
  description: string | null;
  staff: {
    edges: StaffEdge[];
  };
}

export type TabId = "trending" | "topRated" | "newManhwa" | "popularManga";

export interface Tab {
  id: TabId;
  label: string;
}
