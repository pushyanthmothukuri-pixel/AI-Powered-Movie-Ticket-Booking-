import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BookmarkX,
  Calendar,
  MapPin,
  QrCode,
  Ticket,
  Trash2,
} from 'lucide-react';
import { BookingRecord, Movie } from '../types/cinema';
import { QrCodeImage, TicketQrModal } from './TicketQrPass';

interface MyBookingsViewProps {
  bookings: BookingRecord[];
  onCancelBooking: (id: string) => void;
  onExploreNowShowing: () => void;
}

export const MyBookingsView: React.FC<MyBookingsViewProps> = ({
  bookings,
  onCancelBooking,
  onExploreNowShowing,
}) => {
  const [activeTicket, setActiveTicket] = useState<BookingRecord | null>(null);

  return (
    <section className="relative z-10 flex h-full w-full flex-col px-5 pt-[98px] pb-24 md:pb-12 md:pl-[108px] md:pr-8 lg:pl-[264px] lg:pr-[60px] xl:pr-[210px] overflow-y-auto cine-scrollbar">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="text-[13px] uppercase tracking-[0.2em] text-[#e50914]">
            Digital Passes · Click any ticket to open QR
          </p>
          <h2 className="mt-1 font-display text-5xl sm:text-6xl tracking-[0.08em] text-white">
            MY BOOKINGS
          </h2>
        </div>
        <span className="text-[15px] text-white/55">
          {bookings.length}{' '}
          {bookings.length === 1 ? 'Active Pass' : 'Active Passes'}
        </span>
      </div>

      {bookings.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.02] p-10 text-center">
          <Ticket className="h-9 w-9 text-white/25 mb-3" />
          <h3 className="text-base font-medium text-white/85">
            No active reservations yet
          </h3>
          <p className="mt-1 max-w-sm text-xs text-white/45">
            Select any film from Now Showing to choose your preferred format,
            theatre, and AI-recommended seats.
          </p>
          <button
            onClick={onExploreNowShowing}
            className="mt-5 rounded-md bg-[#e50914] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-white hover:bg-[#f6121d] transition-colors cursor-pointer"
          >
            Browse Now Showing
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {bookings.map((b, idx) => (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => setActiveTicket(b)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setActiveTicket(b);
                }
              }}
              className="group flex overflow-hidden rounded-xl border border-white/10 bg-[#111117]/90 shadow-xl backdrop-blur-md hover:border-white/25 hover:bg-[#15151e]/95 transition-all cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-[#e50914]"
            >
              <img
                src={b.poster}
                alt={b.movieTitle}
                className="w-24 sm:w-28 object-cover shrink-0 transition-transform duration-500 group-hover:scale-105"
              />
              <div className="flex flex-1 flex-col justify-between p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="rounded-sm bg-[#e50914]/20 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#ff5c65]">
                        {b.format}
                      </span>
                      <span className="font-mono text-xs text-white/55">
                        {b.ticketCode}
                      </span>
                    </div>
                    <h3 className="mt-2 truncate text-lg font-semibold text-white">
                      {b.movieTitle}
                    </h3>
                    <p className="mt-1 flex items-center gap-1.5 text-[13px] text-white/60 truncate">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        {b.theatreName} · {b.location}
                      </span>
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 text-[13px] text-white/60">
                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        {b.dateLabel} · {b.time}
                      </span>
                    </p>
                  </div>

                  {/* Mini scannable QR thumbnail right on the ticket card */}
                  <div className="hidden sm:flex flex-col items-center gap-1 shrink-0 rounded-lg border border-white/12 bg-[#f7f7fa] p-1.5 group-hover:scale-105 transition-transform">
                    <QrCodeImage booking={b} size={60} />
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-white/[0.07] pt-3 text-[13px]">
                  <div className="flex items-center gap-2">
                    <div>
                      <span className="text-white/50">Seats: </span>
                      <span className="font-medium text-[#d4a853]">
                        {b.seats.join(', ')}
                      </span>
                      <span className="ml-2 text-white/50">
                        (${b.totalAmount})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3.5">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-white/75 group-hover:text-white transition-colors">
                      <QrCode className="h-4 w-4 text-[#e50914]" />
                      <span>Show QR</span>
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCancelBooking(b.id);
                      }}
                      className="flex items-center gap-1 text-xs text-white/45 hover:text-[#ff5c65] transition-colors cursor-pointer"
                      title="Cancel reservation"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Cancel</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Full Scannable Ticket QR Modal */}
      <TicketQrModal
        booking={activeTicket}
        onClose={() => setActiveTicket(null)}
      />
    </section>
  );
};

interface MyListViewProps {
  movies: Movie[];
  onSelectMovie: (movie: Movie) => void;
  onRemoveFromList: (movieId: string) => void;
  onExploreMovies: () => void;
}

export const MyListView: React.FC<MyListViewProps> = ({
  movies,
  onSelectMovie,
  onRemoveFromList,
  onExploreMovies,
}) => {
  return (
    <section className="relative z-10 flex h-full w-full flex-col px-5 pt-[98px] pb-24 md:pb-12 md:pl-[108px] md:pr-8 lg:pl-[264px] lg:pr-[60px] xl:pr-[210px] overflow-y-auto cine-scrollbar">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="text-[13px] uppercase tracking-[0.2em] text-[#d4a853]">
            Personal Watchlist
          </p>
          <h2 className="mt-1 font-display text-5xl sm:text-6xl tracking-[0.08em] text-white">
            MY LIST
          </h2>
        </div>
        <span className="text-[15px] text-white/55">
          {movies.length} {movies.length === 1 ? 'Saved Film' : 'Saved Films'}
        </span>
      </div>

      {movies.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.02] p-10 text-center">
          <BookmarkX className="h-9 w-9 text-white/25 mb-3" />
          <h3 className="text-base font-medium text-white/85">
            Your watchlist is empty
          </h3>
          <p className="mt-1 max-w-sm text-xs text-white/45">
            Save films while browsing categories or search results to keep track
            of screenings you want to book.
          </p>
          <button
            onClick={onExploreMovies}
            className="mt-5 rounded-md bg-white/10 border border-white/15 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-white hover:bg-white/20 transition-colors cursor-pointer"
          >
            Discover Movies
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {movies.map((movie, idx) => (
            <motion.div
              key={movie.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="group relative aspect-[9/16] overflow-hidden rounded-[4px] bg-[#14141a] ring-1 ring-white/10"
            >
              <button
                onClick={() => onSelectMovie(movie)}
                className="h-full w-full text-left cursor-pointer"
              >
                <img
                  src={movie.poster}
                  alt={movie.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 brightness-90"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(180deg, rgba(8,8,12,0.15) 0%, rgba(8,8,12,0.5) 55%, rgba(8,8,12,0.92) 100%)',
                  }}
                />
                <div className="absolute inset-x-3 bottom-3">
                  <span className="text-[9px] uppercase tracking-[0.16em] text-white/60">
                    {movie.genres[0]} · {movie.duration}
                  </span>
                  <h3 className="mt-0.5 text-sm font-medium text-white">
                    {movie.title}
                  </h3>
                </div>
              </button>

              <button
                onClick={() => onRemoveFromList(movie.id)}
                className="absolute top-2.5 right-2.5 rounded-full bg-black/65 p-1.5 text-white/60 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                title="Remove from My List"
                aria-label={`Remove ${movie.title} from My List`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
};
