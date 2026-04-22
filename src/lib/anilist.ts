// src/lib/anilist.ts

const ANILIST_URL = 'https://graphql.anilist.co';

export const fetchFromAniList = async (query: string, variables = {}) => {
  try {
    const response = await fetch(ANILIST_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    const json = await response.json();
    
    if (!response.ok) {
      throw new Error(json.errors?.[0]?.message || 'Gagal narik data AniList');
    }

    return json.data;
  } catch (err) {
    console.error('AniList API Error:', err);
    throw err;
  }
};