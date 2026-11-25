export type CategoryId =
  | 'action'
  | 'animation'
  | 'thriller'
  | 'scifi'
  | 'drama'
  | 'crime'
  | 'horror'
  | 'history';

export type NavSection =
  | 'home'
  | 'movies'
  | 'now-showing'
  | 'coming-soon'
  | 'categories'
  | 'my-bookings'
  | 'my-list';

export interface CategoryItem {
  id: CategoryId;
  label: string;
  shortLabel: string;
  poster: string;
  ambientColor: string;
  staggerY: number;
  heightClass: string;
  tagline: string;
}

export interface CastMember {
  name: string;
  role: string;
}

export interface Movie {
  id: string;
  title: string;
  categoryId: CategoryId;
  genres: string[];
  status: 'now-showing' | 'coming-soon';
  poster: string;
  backdrop: string;
  rating: number;
  ageRating: string;
  duration: string;
  language: string;
  releaseYear: number;
  releaseDate: string;
  director: string;
  cast: CastMember[];
  synopsis: string;
  aiInsight: string;
  trailerYoutubeId?: string;
  trailerPreviewTagline: string;
  formats: ('IMAX 2D' | 'Dolby Atmos' | '4DX' | 'Laser 2D')[];
  staggerY: number;
  ambientColor: string;
}

export interface Theatre {
  id: string;
  name: string;
  location: string;
  distance: string;
  showtimes: {
    id: string;
    time: string;
    format: 'IMAX 2D' | 'Dolby Atmos' | '4DX' | 'Laser 2D';
    price: number;
    fillingFast?: boolean;
  }[];
}

export interface BookingRecord {
  id: string;
  movieId: string;
  movieTitle: string;
  poster: string;
  theatreName: string;
  location: string;
  dateLabel: string;
  time: string;
  format: string;
  seats: string[];
  totalAmount: number;
  bookedAt: string;
  ticketCode: string;
}
