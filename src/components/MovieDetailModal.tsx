import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bookmark,
  Check,
  Clock,
  Globe,
  Play,
  Sparkles,
  Star,
  Ticket,
  UserCheck,
  X,
} from 'lucide-react';
import { Movie } from '../types/cinema';

interface MovieDetailModalProps {
  movie: Movie | null;
  isInMyList: boolean;
  onToggleMyList: (movieId: string) => void;
  onClose: () => void;
  onBookTickets: (movie: Movie) => void;
}

export const MovieDetailModal: React.FC<MovieDetailModalProps> = ({
  movie,
  isInMyList,
  onToggleMyList,
  onClose,
  onBookTickets,
}) => {
  const [trailerOpen, setTrailerOpen] = useState(false);

  useEffect(() => {
    setTrailerOpen(false);
  }, [movie?.id]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (trailerOpen) {
          setTrailerOpen(false);
        } else if (movie) {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [movie, trailerOpen, onClose]);

  return (
    <AnimatePresence>
      {movie && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28 }}
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 p-3 sm:p-6 backdrop-blur-xl"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={movie.title}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto overflow-x-hidden rounded-xl border border-white/10 bg-[#0d0d12] shadow-[0_30px_90px_rgba(0,0,0,0.9)] cine-scrollbar"
          >
            {/* Atmospheric Backdrop Header */}
            <div className="relative h-64 sm:h-80 w-full overflow-hidden">
              <img
                src={movie.backdrop}
                alt=""
                className="h-full w-full object-cover object-center scale-105 brightness-75 blur-[2px]"
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(180deg, rgba(13,13,18,0.35) 0%, rgba(13,13,18,0.72) 55%, #0d0d12 100%)',
                }}
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(90deg, #0d0d12 0%, rgba(13,13,18,0.45) 45%, rgba(13,13,18,0.8) 100%)',
                }}
              />

              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/55 text-white/80 hover:border-white/35 hover:text-white backdrop-blur-md transition-colors cursor-pointer"
                aria-label="Close details"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Main Content */}
            <div className="relative -mt-40 sm:-mt-48 px-5 pb-8 sm:px-9">
              <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-start">
                {/* Vertical Portrait Poster */}
                <div className="w-36 sm:w-48 shrink-0 overflow-hidden rounded-[4px] border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.85)] aspect-[9/16]">
                  <img
                    src={movie.poster}
                    alt={movie.title}
                    className="h-full w-full object-cover"
                  />
                </div>

                {/* Metadata & Actions */}
                <div className="flex-1 pt-2 sm:pt-12">
                  <div className="flex flex-wrap items-center gap-2.5 text-xs uppercase tracking-[0.18em] text-white/65">
                    <span
                      className={`rounded-sm px-2.5 py-0.5 text-[11px] font-semibold ${
                        movie.status === 'now-showing'
                          ? 'bg-[#e50914] text-white'
                          : 'bg-white/15 text-white/90'
                      }`}
                    >
                      {movie.status === 'now-showing'
                        ? 'Now Showing'
                        : movie.releaseDate}
                    </span>
                    <span>{movie.genres.join(' · ')}</span>
                    <span className="rounded border border-white/15 px-1.5 py-0.5 text-[11px]">
                      {movie.ageRating}
                    </span>
                  </div>

                  <h1 className="mt-3 font-display text-4xl sm:text-6xl tracking-[0.06em] text-white leading-none">
                    {movie.title}
                  </h1>

                  {/* Key specs */}
                  <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-white/80">
                    <span className="inline-flex items-center gap-1.5 text-[#d4a853] font-medium">
                      <Star className="h-4 w-4 fill-[#d4a853]" />
                      {movie.rating.toFixed(1)} / 10
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-white/50" />
                      {movie.duration}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Globe className="h-4 w-4 text-white/50" />
                      {movie.language}
                    </span>
                    <span className="text-white/50">{movie.releaseYear}</span>
                  </div>

                  {/* AI Recommendation Strip */}
                  <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3.5 py-2.5 text-[13px] text-white/85">
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#d4a853]" />
                    <span>{movie.aiInsight}</span>
                  </div>

                  {/* Synopsis */}
                  <p className="mt-4 text-[15px] leading-relaxed text-white/80">
                    {movie.synopsis}
                  </p>

                  {/* Primary Booking & Trailer Actions */}
                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => onBookTickets(movie)}
                      className="flex items-center gap-2 rounded-md bg-[#e50914] px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white shadow-[0_10px_30px_rgba(229,9,20,0.4)] hover:bg-[#f6121d] active:scale-[0.98] transition-all cursor-pointer"
                    >
                      <Ticket className="h-4 w-4" />
                      <span>
                        {movie.status === 'now-showing'
                          ? 'Book Tickets'
                          : 'Pre-Book Tickets'}
                      </span>
                    </button>

                    <button
                      onClick={() => setTrailerOpen(true)}
                      className="flex items-center gap-2 rounded-md border border-white/20 bg-white/[0.05] px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white/90 hover:border-white/40 hover:bg-white/[0.1] transition-all cursor-pointer"
                    >
                      <Play className="h-3.5 w-3.5 fill-current" />
                      <span>Watch Trailer</span>
                    </button>

                    <button
                      onClick={() => onToggleMyList(movie.id)}
                      className={`flex items-center gap-2 rounded-md border px-4 py-3 text-xs font-medium uppercase tracking-[0.14em] transition-all cursor-pointer ${
                        isInMyList
                          ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-300'
                          : 'border-white/15 bg-transparent text-white/70 hover:border-white/30 hover:text-white'
                      }`}
                    >
                      {isInMyList ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          <span>In My List</span>
                        </>
                      ) : (
                        <>
                          <Bookmark className="h-3.5 w-3.5" />
                          <span>My List</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Cast & Crew */}
                  <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-white/[0.07] pt-5">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">
                        Director
                      </p>
                      <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-white/90">
                        <UserCheck className="h-3.5 w-3.5 text-white/45" />
                        {movie.director}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {movie.formats.map((fmt) => (
                          <span
                            key={fmt}
                            className="rounded border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] tracking-wider text-white/60"
                          >
                            {fmt}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">
                        Cast
                      </p>
                      <ul className="mt-1.5 space-y-1">
                        {movie.cast.map((member) => (
                          <li
                            key={member.name}
                            className="flex items-center justify-between text-xs"
                          >
                            <span className="text-white/85">{member.name}</span>
                            <span className="text-white/40">{member.role}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Embedded Cinematic Trailer Preview Modal */}
            <AnimatePresence>
              {trailerOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-30 flex items-center justify-center bg-black/92 p-5 backdrop-blur-xl"
                >
                  <div className="relative w-full max-w-2xl overflow-hidden rounded-xl border border-white/15 bg-[#0a0a0e] shadow-2xl">
                    <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white">
                          {movie.title} — Official Teaser
                        </p>
                        <p className="text-[11px] text-white/45">
                          {movie.trailerPreviewTagline}
                        </p>
                      </div>
                      <button
                        onClick={() => setTrailerOpen(false)}
                        className="rounded-full p-1.5 text-white/60 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                        aria-label="Close trailer"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Animated Cinematic Trailer Stage */}
                    <div className="relative aspect-video w-full overflow-hidden bg-black">
                      <motion.img
                        src={movie.backdrop}
                        alt={movie.title}
                        animate={{ scale: [1.02, 1.12, 1.04] }}
                        transition={{
                          duration: 14,
                          repeat: Infinity,
                          repeatType: 'reverse',
                          ease: 'easeInOut',
                        }}
                        className="h-full w-full object-cover brightness-75"
                      />
                      {/* Widescreen cinema letterbox bars */}
                      <div className="pointer-events-none absolute top-0 inset-x-0 h-7 bg-black" />
                      <div className="pointer-events-none absolute bottom-0 inset-x-0 h-7 bg-black" />
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/35 px-6 text-center">
                        <motion.span
                          initial={{ opacity: 0, letterSpacing: '0.2em' }}
                          animate={{ opacity: 1, letterSpacing: '0.35em' }}
                          transition={{ duration: 1.2 }}
                          className="text-[10px] uppercase text-[#d4a853]"
                        >
                          CINE GO EXCLUSIVE PREVIEW
                        </motion.span>
                        <h3 className="mt-2 font-display text-4xl sm:text-5xl tracking-[0.12em] text-white drop-shadow-lg">
                          {movie.title}
                        </h3>
                        <p className="mt-2 max-w-md text-xs text-white/75">
                          {movie.trailerPreviewTagline}
                        </p>
                        <button
                          onClick={() => {
                            setTrailerOpen(false);
                            onBookTickets(movie);
                          }}
                          className="mt-5 flex items-center gap-2 rounded-full bg-[#e50914] px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white hover:bg-[#f6121d] transition-colors cursor-pointer"
                        >
                          <Ticket className="h-3.5 w-3.5" />
                          Book Screening Now
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
