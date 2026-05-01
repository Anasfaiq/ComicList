// Shared Fields
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
      node { name { full } }
    }
  }
`;

const buildPageQuery = (sort: string, extraFilters = "") => `
  query ($page: Int) {
    Page(page: $page, perPage: 8) {
      pageInfo {
        hasNextPage
      }
      media(
        sort: [${sort}]
        type: MANGA
        ${extraFilters}
        isAdult: false
      ) { ${MEDIA_FIELDS} }
    }
  }
`;

// Tab Queries
export const TRENDING_QUERY = buildPageQuery("TRENDING_DESC");
export const TOP_RATED_QUERY = buildPageQuery("SCORE_DESC");
export const NEW_MANHWA_QUERY = buildPageQuery(
  "START_DATE_DESC",
  "countryOfOrigin: KR",
);
export const POPULAR_MANGA_QUERY = buildPageQuery(
  "POPULARITY_DESC",
  "countryOfOrigin: JP",
);

export const QUERIES_BY_TAB: Record<string, string> = {
  trending: TRENDING_QUERY,
  topRated: TOP_RATED_QUERY,
  newManhwa: NEW_MANHWA_QUERY,
  popularManga: POPULAR_MANGA_QUERY,
};

// Search Query
export const SEARCH_QUERY = `
  query ($search: String) {
    Page(page: 1, perPage: 8) {
      media(search: $search, type: MANGA, isAdult: false) {
        id
        title { romaji english }
        coverImage { large }
        countryOfOrigin
      }
    }
  }
`;

// Detail Query
export const DETAIL_QUERY = `
  query ($id: Int) {
    Media(id: $id, type: MANGA) {
      id
      title { romaji english }
      coverImage { large extraLarge }
      averageScore
      countryOfOrigin
      description(asHtml: false)
      status
      genres
      staff(perPage: 10) {
        edges {
          role
          node { name { full } }
        }
      }
    }
  }
`;
