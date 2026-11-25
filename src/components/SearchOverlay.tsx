import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Film, Search, Star, Ticket, X } from 'lucide-react';
import { MOVIES } from '../data/movies';
import { Movie } from '../types/cinema';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMovie: (movie: Movie) => void;
}

const QUICK_FILTERS = [
  'Sci-Fi',
  'Thriller',
  'Action',
  'English',
  'Japanese',
  'Spanish',
  'IMAX',
];

export const SearchOverlay: React.FC<SearchOverlayProps> = ({
  isOpen,
  onClose,
  onSelectMovie,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 120);
      return () => clearTimeout(timer);
    }
    setQuery('');
  }, [isOpen]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return MOVIES;

    return MOVIES.filter((movie) => {
      const inTitle = movie.title.toLowerCase().includes(q);
      const inGenre = movie.genres.some((g) => g.toLowerCase().includes(q));
      const inLanguage = movie.language.toLowerCase().includes(q);
      const inCast = movie.cast.some(
        (c) =>
          c.name.toLowerCase().includes(q) || c.role.toLowerCase().includes(q)
      );
      const inDirector = movie.director.toLowerCase().includes(q);
      const inFormats = movie.formats.some((f) =>
        f.toLowerCase().includes(q)
      );
      return (
        inTitle ||
        inGenre ||
        inLanguage ||
        inCast ||
        inDirector ||
        inFormats
      );
    });
  }, [query]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-50 flex flex-col bg-[#08080b]/92 backdrop-blur-2xl"
          role="dialog"
          aria-modal="true"
          aria-label="Search movies"
        >
          {/* Top Search Header */}
          <div className="mx-auto w-full max-w-6xl px-5 pt-7 pb-5 sm:px-10">
            <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div className="flex flex-1 items-center gap-3.5">
                <Search className="h-5 w-5 text-[#e50914]" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search titles, actors, genres, or languages..."
                  className="w-full bg-transparent text-lg sm:text-2xl font-light tracking-wide text-white placeholder:text-white/30 focus:outline-none"
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="rounded-full p-1 text-white/45 hover:text-white transition-colors cursor-pointer"
                    aria-label="Clear search query"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <button
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-white/70 hover:border-white/30 hover:text-white transition-colors cursor-pointer"
                aria-label="Close search"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Quick discovery chips */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-[10px] uppercase tracking-[0.2em] text-white/35 mr-1">
                Quick Filter:
              </span>
              {QUICK_FILTERS.map((chip) => {
                const active = query.toLowerCase() === chip.toLowerCase();
                return (
                  <button
                    key={chip}
                    onClick={() => setQuery(active ? '' : chip)}
                    className={`rounded-full px-3 py-1 text-[11px] tracking-wider transition-all cursor-pointer ${
                      active
                        ? 'bg-[#e50914] text-white'
                        : 'border border-white/10 bg-white/[0.03] text-white/60 hover:border-white/25 hover:text-white'
                    }`}
                  >
                    {chip}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Matching Vertical Poster Results */}
          <div className="mx-auto w-full max-w-6xl flex-1 overflow-y-auto px-5 pb-12 sm:px-10 cine-scrollbar">
            {results.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center text-center">
                <Film className="h-8 w-8 text-white/20 mb-3" />
                <p className="text-sm text-white/65">
                  No films matched &ldquo;{query}&rdquo;.
                </p>
                <p className="mt-1 text-xs text-white/35">
                  Try searching by actor (e.g. Clara Vance), language (Japanese,
                  Spanish), or genre.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {results.map((movie, idx) => (
                  <motion.button
                    key={movie.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(idx * 0.03, 0.25) }}
                    onClick={() => {
                      onSelectMovie(movie);
                      onClose();
                    }}
                    className="group relative aspect-[9/16] overflow-hidden rounded-[4px] bg-[#14141a] text-left ring-1 ring-white/10 hover:ring-white/35 transition-all cursor-pointer"
                  >
                    <img
                      src={movie.poster}
                      alt={movie.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 brightness-90 group-hover:brightness-105"
                    />
                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          'linear-gradient(180deg, rgba(8,8,12,0.15) 0%, rgba(8,8,12,0.55) 60%, rgba(8,8,12,0.94) 100%)',
                      }}
                    />

                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1 rounded-sm bg-black/65 px-1.5 py-0.5 text-[10px] text-[#d4a853] backdrop-blur-sm">
                      <Star className="h-2.5 w-2.5 fill-[#d4a853]" />
                      <span>{movie.rating.toFixed(1)}</span>
                    </div>

                    <div className="absolute inset-x-3 bottom-3 flex flex-col gap-1">
                      <span className="text-[9px] uppercase tracking-[0.16em] text-white/60">
                        {movie.genres[0]} · {movie.language}
                      </span>
                      <h4 className="text-sm font-medium leading-tight text-white">
                        {movie.title}
                      </h4>
                      <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-[0.14em] text-[#ff5963] opacity-0 group-hover:opacity-100 transition-opacity">
                        <Ticket className="h-3 w-3" />
                        Select &amp; Book
                      </span>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
