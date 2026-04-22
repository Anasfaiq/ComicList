import type { StaffEdge } from "../types";

// Author Extractor

/**
 * Ambil nama author dari staff edges AniList.
 * Prioritas: Story & Art > Story > Art > Original Story > staff pertama
 */
export const getAuthor = (edges: StaffEdge[]): string => {
  if (!edges || edges.length === 0) return "Unknown";

  const priority = [
    "Story & Art",
    "Story",
    "Art",
    "Original Story",
    "Original Character Design",
  ];

  for (const target of priority) {
    const found = edges.find((e) => e.role === target);
    if (found) return found.node.name.full;
  }

  // Fallback: ambil yang rolenya mengandung "Story" atau "Art"
  const fallback = edges.find(
    (e) => e.role.includes("Story") || e.role.includes("Art"),
  );

  return fallback?.node.name.full ?? edges[0].node.name.full;
};

// Description Cleaner

/**
 * Bersihin deskripsi dari AniList:
 * - Hapus HTML tags (<br>, <i>, <b>, dst)
 * - Decode HTML entities (&amp; &lt; dst)
 * - Potong di karakter ke-n
 */
export const cleanDescription = (
  raw: string | null,
  maxLength = 120,
): string => {
  if (!raw) return "No description available.";

  const stripped = raw
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

  if (stripped.length <= maxLength) return stripped;
  return stripped.slice(0, maxLength).trimEnd() + "…";
};

// Badge Helper

export const getBadge = (country: string): { label: string; color: string } => {
  if (country === "KR") return { label: "Manhwa", color: "#22c55e" }; // green
  if (country === "CN") return { label: "Manhua", color: "#f97316" }; // orange
  return { label: "Manga", color: "#3b82f6" }; // blue
};

// Score Formatter

export const formatScore = (score: number | null): string => {
  if (!score) return "N/A";
  return (score / 10).toFixed(1) + "/10";
};

// Title Helper

export const getTitle = (title: {
  romaji: string;
  english: string | null;
}): string => {
  return title.english || title.romaji;
};
