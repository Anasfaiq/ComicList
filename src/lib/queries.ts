// Field Fragment
// Field ini di-reuse di semua query supaya konsisten

const MEDIA_FIELDS = `
  id
  title { romaji english }
  coverImage { large }
  averageScore
  countryOfOrigin
  description(asHtml: false)
  staff(perPage: 5) {
    edges {
      role
      node {
        name { full }
      }
    }
  }
`;

// Query Builders

const buildPageQuery = (sort: string, extraFilters = "") => `
  query {
    Page(page: 1, perPage: 8) {
      media(
        sort: [${sort}]
        type: MANGA
        ${extraFilters}
        isAdult: false
      ) {
        ${MEDIA_FIELDS}
      }
    }
  }
`;

// Exported Queries

export const TRENDING_QUERY = buildPageQuery("TRENDING_DESC");

export const TOP_RATED_QUERY = buildPageQuery("SCORE_DESC");

// Filter by country KR = Korea (Manhwa)
export const NEW_MANHWA_QUERY = buildPageQuery(
  "START_DATE_DESC",
  "countryOfOrigin: KR",
);

// Filter by country JP = Japan (Manga)
export const POPULAR_MANGA_QUERY = buildPageQuery(
  "POPULARITY_DESC",
  "countryOfOrigin: JP",
);

// Map tab ID ke query string-nya
export const QUERIES_BY_TAB: Record<string, string> = {
  trending: TRENDING_QUERY,
  topRated: TOP_RATED_QUERY,
  newManhwa: NEW_MANHWA_QUERY,
  popularManga: POPULAR_MANGA_QUERY,
};
