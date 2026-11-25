import { BOOKING_DATES, MOVIES } from '../data/movies';
import {
  AiConciergeResponse,
  AiTheatrePick,
  getTheatresForLocation,
  runCineGoAiQuery,
  UserLocation,
} from './locationAndAi';
import { buildSeatStatusMap, getAiRecommendedSeats } from '../utils/seating';
import { CategoryId, Movie } from '../types/cinema';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
const GEMINI_MODELS = [
  'gemini-3-flash-preview',
  'gemini-flash-lite-latest',
  'gemini-flash-latest',
];

interface GeminiParsedPayload {
  headline?: string;
  summary?: string;
  bestScreen?: 'IMAX 2D' | 'Dolby Atmos' | '4DX' | 'Laser 2D' | string;
  bestScreenReason?: string;
  matchedMovieId?: string | null;
  externalMovieTitle?: string | null;
  externalMovieYear?: number | null;
  externalMovieDuration?: string | null;
  externalMovieLanguage?: string | null;
  externalMovieGenre?: string | null;
  externalMovieRating?: number | null;
  externalMovieSynopsis?: string | null;
  suggestedMovieIds?: string[];
  actionHint?: 'open-bookings' | 'open-mylist' | 'open-coming-soon' | null;
}

export interface EnhancedTheatrePick extends AiTheatrePick {
  vacantCount: number;
  allShowtimes: {
    id: string;
    time: string;
    format: 'IMAX 2D' | 'Dolby Atmos' | '4DX' | 'Laser 2D';
    price: number;
    vacantCount: number;
    bestSeats: string[];
  }[];
}

export interface GeminiAiResult extends Omit<AiConciergeResponse, 'theatrePicks'> {
  poweredBy: 'gemini' | 'local-fallback';
  bestScreen?: string;
  bestScreenReason?: string;
  theatrePicks?: EnhancedTheatrePick[];
}

function genreToPoster(genreRaw?: string | null): {
  categoryId: CategoryId;
  poster: string;
  ambientColor: string;
} {
  const g = (genreRaw ?? '').toLowerCase();
  if (g.includes('sci') || g.includes('space')) {
    return {
      categoryId: 'scifi',
      poster: '/posters/scifi.jpg',
      ambientColor: 'rgba(128, 152, 178, 0.24)',
    };
  }
  if (g.includes('anim')) {
    return {
      categoryId: 'animation',
      poster: '/posters/animation.jpg',
      ambientColor: 'rgba(220, 48, 48, 0.24)',
    };
  }
  if (g.includes('thril') || g.includes('myst')) {
    return {
      categoryId: 'thriller',
      poster: '/posters/thriller.jpg',
      ambientColor: 'rgba(212, 168, 52, 0.24)',
    };
  }
  if (g.includes('crime') || g.includes('noir')) {
    return {
      categoryId: 'crime',
      poster: '/posters/crime.jpg',
      ambientColor: 'rgba(185, 28, 38, 0.24)',
    };
  }
  if (g.includes('horr')) {
    return {
      categoryId: 'horror',
      poster: '/posters/horror.jpg',
      ambientColor: 'rgba(130, 140, 160, 0.2)',
    };
  }
  if (g.includes('hist') || g.includes('war')) {
    return {
      categoryId: 'history',
      poster: '/posters/history.jpg',
      ambientColor: 'rgba(164, 118, 76, 0.24)',
    };
  }
  if (g.includes('drama') || g.includes('bio')) {
    return {
      categoryId: 'drama',
      poster: '/posters/drama.jpg',
      ambientColor: 'rgba(182, 158, 132, 0.22)',
    };
  }
  return {
    categoryId: 'action',
    poster: '/posters/action.jpg',
    ambientColor: 'rgba(196, 138, 78, 0.24)',
  };
}

function createVirtualMovieFromGemini(
  parsed: GeminiParsedPayload,
  fallbackTitle: string
): Movie {
  const title = (parsed.externalMovieTitle || fallbackTitle).trim();
  const visual = genreToPoster(parsed.externalMovieGenre);
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  return {
    id: `ext-${slug || 'feature'}`,
    title,
    categoryId: visual.categoryId,
    genres: parsed.externalMovieGenre
      ? [parsed.externalMovieGenre]
      : ['Feature Film'],
    status: 'now-showing',
    poster: visual.poster,
    backdrop: visual.poster,
    rating: parsed.externalMovieRating ?? 8.7,
    ageRating: 'PG-13',
    duration: parsed.externalMovieDuration || '2h 18m',
    language: parsed.externalMovieLanguage || 'English',
    releaseYear: parsed.externalMovieYear ?? 2026,
    releaseDate: 'Now in Theatres',
    director: 'Special Screening',
    cast: [{ name: 'Featured Ensemble', role: 'Lead Cast' }],
    synopsis:
      parsed.externalMovieSynopsis ||
      parsed.summary ||
      `${title} is screening today in select premium formats near you.`,
    aiInsight:
      parsed.bestScreenReason ||
      'Recommended in center-row acoustic sweet-spot seating.',
    trailerPreviewTagline: `Experience ${title} in ${
      parsed.bestScreen || 'IMAX 2D'
    }.`,
    formats: ['IMAX 2D', 'Dolby Atmos', '4DX', 'Laser 2D'],
    staggerY: 0,
    ambientColor: visual.ambientColor,
  };
}

function countVacantSeats(seatMap: Map<string, string>): number {
  let count = 0;
  for (const state of seatMap.values()) {
    if (state === 'available') count += 1;
  }
  return count;
}

function buildLiveTheatrePicks(
  movieId: string,
  location: UserLocation,
  preferredFormat: string
): EnhancedTheatrePick[] {
  const localTheatres = getTheatresForLocation(location);
  const todayId = BOOKING_DATES[0].id;

  return localTheatres.map((theatre) => {
    const allShowtimes = theatre.showtimes.map((st) => {
      const seed = `${movieId}-${theatre.id}-${todayId}-${st.id}`;
      const seatMap = buildSeatStatusMap(seed);
      return {
        id: st.id,
        time: st.time,
        format: st.format,
        price: st.price,
        vacantCount: countVacantSeats(seatMap),
        bestSeats: getAiRecommendedSeats(seatMap, 3),
      };
    });

    const preferredShow =
      theatre.showtimes.find((s) => s.format === preferredFormat) ??
      theatre.showtimes[1] ??
      theatre.showtimes[0];

    const matchedShowMeta =
      allShowtimes.find((s) => s.id === preferredShow.id) ?? allShowtimes[0];

    return {
      theatre,
      showtime: preferredShow,
      bestSeats: matchedShowMeta.bestSeats,
      vacantCount: matchedShowMeta.vacantCount,
      allShowtimes,
      reason: `${preferredShow.format} · ${matchedShowMeta.vacantCount} vacant · Best seats ${matchedShowMeta.bestSeats.join(', ')}`,
    };
  });
}

function buildSystemContext(
  location: UserLocation,
  preferredFormat: string
): string {
  const localTheatres = getTheatresForLocation(location);
  const catalogSummary = MOVIES.map((m) => ({
    id: m.id,
    title: m.title,
    genres: m.genres,
    status: m.status,
    rating: m.rating,
    duration: m.duration,
    language: m.language,
    director: m.director,
    formats: m.formats,
  }));

  const theatreSummary = localTheatres.map((t) => ({
    name: t.name,
    location: t.location,
    distance: t.distance,
    showtimes: t.showtimes.map((s) => `${s.time} (${s.format}, $${s.price})`),
  }));

  return [
    'You are CINE GO AI, an intelligent cinema & ticket-booking assistant.',
    `Active Location: ${location.label}. Preferred Format: ${preferredFormat}.`,
    `Local Theatres & Showtimes today: ${JSON.stringify(theatreSummary)}.`,
    `CINE GO Featured Catalog: ${JSON.stringify(catalogSummary)}.`,
    'Instructions:',
    '- Answer the exact question the user asks clearly, accurately, and concisely.',
    '- When the user asks about ANY movie (whether it is in CINE GO Featured Catalog OR a real-world movie like Interstellar, Dune, Pushpa 2, Deadpool, Avatar, etc.):',
    '  1) If it is in CINE GO Featured Catalog, set matchedMovieId to its exact id from the catalog and set externalMovieTitle to null.',
    '  2) If it is a real-world movie NOT in the catalog, set matchedMovieId to null and fill externalMovieTitle, externalMovieYear, externalMovieDuration, externalMovieLanguage, externalMovieGenre, externalMovieRating, and externalMovieSynopsis accurately.',
    '  3) Always set bestScreen ("IMAX 2D", "Dolby Atmos", "4DX", or "Laser 2D") and bestScreenReason explaining WHY that screen/format is the best way to experience that specific film (e.g. IMAX cameras/aspect ratio, spatial Dolby Atmos sound design, 4DX motion).',
    '  4) In summary, directly address show timings, the best screen to watch on, and why center-row vacant seats (like Row G / Row F) deliver the best viewing & acoustic experience.',
    '- If the user asks for recommendations/comparisons across genres or languages, populate suggestedMovieIds with up to 4 catalog ids.',
    '- Only set actionHint if the user asks to navigate ("open-bookings", "open-mylist", "open-coming-soon"); otherwise null.',
    'Return ONLY valid JSON matching this schema:',
    '{"headline": string, "summary": string, "bestScreen": string, "bestScreenReason": string, "matchedMovieId": string|null, "externalMovieTitle": string|null, "externalMovieYear": number|null, "externalMovieDuration": string|null, "externalMovieLanguage": string|null, "externalMovieGenre": string|null, "externalMovieRating": number|null, "externalMovieSynopsis": string|null, "suggestedMovieIds": string[], "actionHint": "open-bookings"|"open-mylist"|"open-coming-soon"|null}',
  ].join('\n');
}

function parseJsonResponse(text: string): GeminiParsedPayload | null {
  try {
    const cleaned = text
      .trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```$/i, '')
      .trim();
    return JSON.parse(cleaned) as GeminiParsedPayload;
  } catch {
    return null;
  }
}

export async function askGeminiConcierge(
  rawQuery: string,
  location: UserLocation,
  preferredFormat: string
): Promise<GeminiAiResult> {
  const query = rawQuery.trim();
  if (!query) {
    const fallback = runCineGoAiQuery('', location, preferredFormat);
    return {
      ...fallback,
      theatrePicks: fallback.matchedMovie
        ? buildLiveTheatrePicks(
            fallback.matchedMovie.id,
            location,
            preferredFormat
          )
        : undefined,
      poweredBy: 'local-fallback',
    };
  }

  // Deterministic catalog pre-match so known CINE GO movies never miss
  const qLower = query.toLowerCase();
  const directCatalogMatch = MOVIES.find(
    (m) =>
      qLower === m.title.toLowerCase() ||
      qLower.includes(m.title.toLowerCase())
  );

  if (GEMINI_API_KEY) {
    const systemPrompt = buildSystemContext(location, preferredFormat);

    for (const model of GEMINI_MODELS) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 14000);

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
            GEMINI_API_KEY
          )}`,
          {
            method: 'POST',
            signal: controller.signal,
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              systemInstruction: {
                parts: [{ text: systemPrompt }],
              },
              contents: [
                {
                  role: 'user',
                  parts: [{ text: query }],
                },
              ],
              generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 2048,
                responseMimeType: 'application/json',
              },
            }),
          }
        );

        clearTimeout(timeout);
        if (!res.ok) continue;

        const data = await res.json();
        const rawText: string | undefined =
          data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawText) continue;

        const parsed = parseJsonResponse(rawText);
        if (!parsed) continue;

        const catalogMovie =
          directCatalogMatch ??
          (parsed.matchedMovieId
            ? MOVIES.find((m) => m.id === parsed.matchedMovieId)
            : undefined);

        const resolvedMovie =
          catalogMovie ??
          (parsed.externalMovieTitle
            ? createVirtualMovieFromGemini(parsed, query)
            : undefined);

        const suggestedMovies = (parsed.suggestedMovieIds ?? [])
          .map((id) => MOVIES.find((m) => m.id === id))
          .filter((m): m is NonNullable<typeof m> => Boolean(m))
          .slice(0, 4);

        const primaryForTheatres = resolvedMovie ?? suggestedMovies[0];
        const recommendedFormat = parsed.bestScreen || preferredFormat;

        const theatrePicks = primaryForTheatres
          ? buildLiveTheatrePicks(
              primaryForTheatres.id,
              location,
              recommendedFormat
            )
          : undefined;

        return {
          headline:
            parsed.headline ||
            (primaryForTheatres
              ? `${primaryForTheatres.title} — Showtimes, Best Screen & Vacant Seats`
              : `CINE GO AI · ${location.city}`),
          summary:
            parsed.summary ||
            'Showing today’s screenings, best format, and center-row vacant seats.',
          bestScreen: parsed.bestScreen || recommendedFormat,
          bestScreenReason: parsed.bestScreenReason,
          matchedMovie: primaryForTheatres,
          theatrePicks,
          suggestedMovies:
            suggestedMovies.length > 0 ? suggestedMovies : undefined,
          actionHint: parsed.actionHint ?? undefined,
          poweredBy: 'gemini',
        };
      } catch {
        continue;
      }
    }
  }

  // Fallback if offline/unavailable
  const fallback = runCineGoAiQuery(query, location, preferredFormat);
  const fallbackMovie = directCatalogMatch ?? fallback.matchedMovie;
  return {
    ...fallback,
    matchedMovie: fallbackMovie,
    bestScreen: preferredFormat,
    bestScreenReason: `${preferredFormat} delivers the sharpest sightlines and spatial sound for this screening.`,
    theatrePicks: fallbackMovie
      ? buildLiveTheatrePicks(fallbackMovie.id, location, preferredFormat)
      : undefined,
    poweredBy: 'local-fallback',
  };
}
