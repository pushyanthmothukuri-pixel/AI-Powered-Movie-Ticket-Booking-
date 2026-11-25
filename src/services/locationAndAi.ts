import { BOOKING_DATES, MOVIES, THEATRES } from '../data/movies';
import { Movie, Theatre } from '../types/cinema';
import { buildSeatStatusMap, getAiRecommendedSeats } from '../utils/seating';

export interface UserLocation {
  id: string;
  city: string;
  area: string;
  label: string;
  isLiveGps?: boolean;
}

export const PRESET_LOCATIONS: UserLocation[] = [
  {
    id: 'bengaluru',
    city: 'Bengaluru',
    area: 'Indiranagar & MG Road',
    label: 'Bengaluru · Indiranagar',
  },
  {
    id: 'mumbai',
    city: 'Mumbai',
    area: 'Bandra & Lower Parel',
    label: 'Mumbai · Bandra',
  },
  {
    id: 'hyderabad',
    city: 'Hyderabad',
    area: 'Jubilee Hills & Banjara',
    label: 'Hyderabad · Jubilee Hills',
  },
  {
    id: 'delhi',
    city: 'New Delhi',
    area: 'Connaught Place & Saket',
    label: 'New Delhi · Saket',
  },
  {
    id: 'newyork',
    city: 'New York',
    area: 'Midtown & Lincoln Square',
    label: 'New York · Midtown',
  },
];

/** Adapt theatre locations dynamically to the user's active city/location. */
export function getTheatresForLocation(location: UserLocation): Theatre[] {
  const neighborhoods =
    location.city === 'Bengaluru'
      ? ['Indiranagar Luxe', 'UB City Center', 'Koramangala Nexus']
      : location.city === 'Mumbai'
      ? ['Lower Parel Phoenix', 'Bandra Linking Rd', 'Juhu Promenade']
      : location.city === 'Hyderabad'
      ? ['Jubilee Hills Central', 'Banjara Mall', 'Gachibowli Plaza']
      : location.city === 'New Delhi'
      ? ['Saket Select Walk', 'Connaught Plaza', 'Vasant Kunj']
      : [
          `${location.area}`,
          `${location.city} Central`,
          `${location.city} Harborfront`,
        ];

  return THEATRES.map((t, index) => ({
    ...t,
    location: neighborhoods[index] ?? location.area,
  }));
}

/** Fetch live browser GPS coordinates and reverse-geocode city/area when available. */
export async function detectCurrentLocation(): Promise<UserLocation> {
  if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
    throw new Error('Geolocation is not supported in this browser.');
  }

  const position = await new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 6000,
      maximumAge: 120000,
    });
  });

  const { latitude, longitude } = position.coords;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14`,
      {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      }
    );
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      const addr = data?.address ?? {};
      const city =
        addr.city ||
        addr.town ||
        addr.state_district ||
        addr.state ||
        'Your Area';
      const area =
        addr.suburb ||
        addr.neighbourhood ||
        addr.road ||
        addr.county ||
        `${latitude.toFixed(2)}°N, ${longitude.toFixed(2)}°E`;
      return {
        id: `gps-${latitude.toFixed(2)}-${longitude.toFixed(2)}`,
        city,
        area,
        label: `${city} · ${area}`,
        isLiveGps: true,
      };
    }
  } catch {
    // Graceful fallback when reverse geocoding is blocked/offline
  }

  return {
    id: `gps-${latitude.toFixed(2)}-${longitude.toFixed(2)}`,
    city: 'Current Location',
    area: `${latitude.toFixed(2)}°N, ${longitude.toFixed(2)}°E`,
    label: `GPS · ${latitude.toFixed(2)}°N, ${longitude.toFixed(2)}°E`,
    isLiveGps: true,
  };
}

export interface AiTheatrePick {
  theatre: Theatre;
  showtime: Theatre['showtimes'][number];
  bestSeats: string[];
  reason: string;
}

export interface AiConciergeResponse {
  headline: string;
  summary: string;
  matchedMovie?: Movie;
  theatrePicks?: AiTheatrePick[];
  suggestedMovies?: Movie[];
  actionHint?: 'open-bookings' | 'open-mylist' | 'open-coming-soon';
}

/** Local AI Cinema Concierge handling movie lookups, nearby theatres, best seats, and discovery queries. */
export function runCineGoAiQuery(
  rawQuery: string,
  location: UserLocation,
  preferredFormat: string
): AiConciergeResponse {
  const q = rawQuery.trim().toLowerCase();
  const localTheatres = getTheatresForLocation(location);

  if (!q) {
    const featured = MOVIES[3]; // Orbit Zero
    return buildMovieShowtimePlan(featured, localTheatres, location, preferredFormat);
  }

  // Check for booking / list navigation intents
  if (q.includes('my booking') || q.includes('ticket') && q.includes('my')) {
    return {
      headline: 'Your Digital Passes',
      summary: 'Opening your active CINE GO reservations and QR ticket passes.',
      actionHint: 'open-bookings',
    };
  }
  if (q.includes('my list') || q.includes('watchlist')) {
    return {
      headline: 'Your Saved Watchlist',
      summary: 'Showing the films saved in your personal CINE GO watchlist.',
      actionHint: 'open-mylist',
    };
  }

  // 1. Direct movie title match (exact or partial)
  const movieMatch = MOVIES.find(
    (m) =>
      m.title.toLowerCase().includes(q) ||
      q.includes(m.title.toLowerCase()) ||
      m.title
        .toLowerCase()
        .split(/[:\s]+/)
        .some((word) => word.length >= 4 && q.includes(word))
  );

  if (movieMatch) {
    return buildMovieShowtimePlan(
      movieMatch,
      localTheatres,
      location,
      preferredFormat
    );
  }

  // 2. Genre / Language / Format / Status filtering
  const filtered = MOVIES.filter((m) => {
    const matchGenre = m.genres.some((g) => q.includes(g.toLowerCase()));
    const matchLang = q.includes(m.language.toLowerCase());
    const matchFormat = m.formats.some((f) =>
      q.includes(f.toLowerCase().split(' ')[0])
    );
    const matchCast = m.cast.some((c) => q.includes(c.name.toLowerCase()));
    const matchSoon =
      (q.includes('upcoming') || q.includes('coming soon')) &&
      m.status === 'coming-soon';
    const matchNow =
      (q.includes('tonight') || q.includes('now') || q.includes('best')) &&
      m.status === 'now-showing';
    return (
      matchGenre ||
      matchLang ||
      matchFormat ||
      matchCast ||
      matchSoon ||
      matchNow
    );
  });

  if (filtered.length > 0) {
    const topPick = filtered[0];
    const plan = buildMovieShowtimePlan(
      topPick,
      localTheatres,
      location,
      preferredFormat
    );
    return {
      ...plan,
      headline: `AI Top Match near ${location.city}: ${topPick.title}`,
      summary: `Found ${filtered.length} matching film${
        filtered.length > 1 ? 's' : ''
      }. Showing nearby theatres & acoustic sweet-spot seats for ${topPick.title}.`,
      suggestedMovies: filtered.slice(0, 4),
    };
  }

  // 3. Fallback intelligent top-rated recommendation
  const topRated = [...MOVIES]
    .filter((m) => m.status === 'now-showing')
    .sort((a, b) => b.rating - a.rating);
  const topMovie = topRated[0];
  return {
    ...buildMovieShowtimePlan(
      topMovie,
      localTheatres,
      location,
      preferredFormat
    ),
    headline: `AI Recommendation near ${location.city}`,
    summary: `No exact title match for "${rawQuery}", so CINE GO AI picked ${topMovie.title} (${topMovie.rating}/10) with prime ${preferredFormat} seats available nearby.`,
    suggestedMovies: topRated.slice(0, 4),
  };
}

function buildMovieShowtimePlan(
  movie: Movie,
  theatres: Theatre[],
  location: UserLocation,
  preferredFormat: string
): AiConciergeResponse {
  const todayId = BOOKING_DATES[0].id;
  const picks: AiTheatrePick[] = theatres.map((theatre) => {
    const preferredShow =
      theatre.showtimes.find((s) => s.format === preferredFormat) ??
      theatre.showtimes[1] ??
      theatre.showtimes[0];
    const seed = `${movie.id}-${theatre.id}-${todayId}-${preferredShow.id}`;
    const seatMap = buildSeatStatusMap(seed);
    const bestSeats = getAiRecommendedSeats(seatMap, 3);

    return {
      theatre,
      showtime: preferredShow,
      bestSeats,
      reason: `${preferredShow.format} · Center acoustic sweet-spot (${bestSeats.join(', ')})`,
    };
  });

  return {
    headline: `${movie.title} — Theatres & Best Seats near ${location.city}`,
    summary: `${movie.aiInsight} ${
      movie.status === 'coming-soon'
        ? `Pre-booking open for ${movie.releaseDate}.`
        : `Showing today across ${picks.length} theatres in ${location.area}.`
    }`,
    matchedMovie: movie,
    theatrePicks: picks,
  };
}
