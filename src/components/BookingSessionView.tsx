import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Play,
  Sparkles,
  Star,
  Ticket,
  X,
} from 'lucide-react';
import { BOOKING_DATES } from '../data/movies';
import {
  getTheatresForLocation,
  UserLocation,
} from '../services/locationAndAi';
import { BookingRecord, Movie } from '../types/cinema';
import {
  buildSeatStatusMap,
  getAiRecommendedSeats,
  HALL_ROWS,
  SeatState,
} from '../utils/seating';
import { QrCodeImage } from './TicketQrPass';
import { PaymentSectionModal } from './PaymentSectionModal';

interface BookingSessionViewProps {
  movie: Movie;
  location: UserLocation;
  userName: string;
  isSignedIn: boolean;
  preferredFormat: string;
  initialTheatreId?: string;
  initialShowtimeId?: string;
  initialSeats?: string[];
  onBack: () => void;
  onConfirmBooking: (booking: BookingRecord) => void;
  onViewMyBookings: () => void;
}

const SeatIcon: React.FC<{
  status: SeatState | 'selected' | 'ai-pick';
  seatLabel: string;
}> = ({ status, seatLabel }) => {
  const isSelected = status === 'selected';
  const isBooked = status === 'booked';
  const isSoldOut = status === 'sold-out';
  const isAiPick = status === 'ai-pick';

  const bodyClass = isSelected
    ? 'bg-[#e50914] border-[#ff4d57] shadow-[0_0_12px_rgba(229,9,20,0.6)]'
    : isAiPick
    ? 'bg-[#e8e8ee] border-[#d4a853] ring-1 ring-[#d4a853]/70'
    : isBooked
    ? 'bg-[#46495a] border-[#5b5f73]'
    : isSoldOut
    ? 'bg-transparent border-white/18 opacity-35'
    : 'bg-[#ececf2] border-white/80 group-hover:bg-white group-hover:shadow-[0_0_10px_rgba(255,255,255,0.35)]';

  const baseClass = isSelected
    ? 'bg-[#b80710]'
    : isBooked
    ? 'bg-[#363948]'
    : isSoldOut
    ? 'bg-white/10 opacity-35'
    : 'bg-[#b9bac4] group-hover:bg-white/90';

  return (
    <span
      className="flex flex-col items-center gap-[2px]"
      aria-label={seatLabel}
    >
      <span
        className={`block h-[11px] w-[14px] sm:h-[13px] sm:w-[16px] rounded-t-[3px] rounded-b-[1px] border transition-all duration-200 ${bodyClass}`}
      />
      <span
        className={`block h-[3px] w-[12px] sm:w-[14px] rounded-b-[2px] transition-colors duration-200 ${baseClass}`}
      />
    </span>
  );
};

export const BookingSessionView: React.FC<BookingSessionViewProps> = ({
  movie,
  location,
  userName,
  isSignedIn,
  preferredFormat,
  initialTheatreId,
  initialShowtimeId,
  initialSeats,
  onBack,
  onConfirmBooking,
  onViewMyBookings,
}) => {
  const localTheatres = useMemo(
    () => getTheatresForLocation(location),
    [location]
  );

  const [selectedTheatreId, setSelectedTheatreId] = useState(
    initialTheatreId ?? localTheatres[0].id
  );
  const [selectedDateId, setSelectedDateId] = useState(BOOKING_DATES[0].id);

  const selectedTheatre = useMemo(
    () =>
      localTheatres.find((t) => t.id === selectedTheatreId) ?? localTheatres[0],
    [localTheatres, selectedTheatreId]
  );

  const defaultShowtimeId = useMemo(() => {
    if (initialShowtimeId) {
      const found = selectedTheatre.showtimes.find(
        (s) => s.id === initialShowtimeId
      );
      if (found) return found.id;
    }
    const match = selectedTheatre.showtimes.find(
      (s) => s.format === preferredFormat
    );
    return (match ?? selectedTheatre.showtimes[0]).id;
  }, [selectedTheatre, preferredFormat, initialShowtimeId]);

  const [selectedShowtimeId, setSelectedShowtimeId] =
    useState<string>(defaultShowtimeId);

  const selectedShowtime = useMemo(
    () =>
      selectedTheatre.showtimes.find((s) => s.id === selectedShowtimeId) ??
      selectedTheatre.showtimes[0],
    [selectedTheatre, selectedShowtimeId]
  );

  const seatSeed = `${movie.id}-${selectedTheatre.id}-${selectedDateId}-${selectedShowtime.id}`;

  const seatStatusMap = useMemo(() => buildSeatStatusMap(seatSeed), [seatSeed]);

  const aiRecommendedSeats = useMemo(
    () => getAiRecommendedSeats(seatStatusMap, 3),
    [seatStatusMap]
  );

  const [selectedSeats, setSelectedSeats] = useState<string[]>(() =>
    initialSeats && initialSeats.length > 0 ? initialSeats : aiRecommendedSeats
  );
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [confirmedTicket, setConfirmedTicket] = useState<BookingRecord | null>(
    null
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (trailerOpen) {
          setTrailerOpen(false);
        } else if (paymentOpen) {
          setPaymentOpen(false);
        } else if (confirmedTicket) {
          setConfirmedTicket(null);
          onBack();
        } else {
          onBack();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [trailerOpen, paymentOpen, confirmedTicket, onBack]);

  const validSelectedSeats = useMemo(
    () => selectedSeats.filter((s) => seatStatusMap.get(s) === 'available'),
    [selectedSeats, seatStatusMap]
  );

  const handleTheatreChange = (newTheatreId: string) => {
    setSelectedTheatreId(newTheatreId);
    const nextTheatre =
      localTheatres.find((t) => t.id === newTheatreId) ?? localTheatres[0];
    setSelectedShowtimeId(nextTheatre.showtimes[0].id);
    setSelectedSeats([]);
  };

  const toggleSeat = (seatId: string) => {
    const state = seatStatusMap.get(seatId);
    if (state !== 'available') return;
    setSelectedSeats((prev) => {
      const clean = prev.filter((s) => seatStatusMap.get(s) === 'available');
      if (clean.includes(seatId)) {
        return clean.filter((s) => s !== seatId);
      }
      if (clean.length >= 8) return clean;
      return [...clean, seatId];
    });
  };

  const handleAiBestSeats = () => {
    if (aiRecommendedSeats.length > 0) {
      setSelectedSeats(aiRecommendedSeats);
    }
  };

  const totalPrice = validSelectedSeats.length * selectedShowtime.price;

  const formatSeatLine = (seatId: string) => {
    const row = seatId.charAt(0);
    const num = seatId.slice(1);
    return `Row ${row} Seat ${num}`;
  };

  const handleProceedToPayment = () => {
    if (validSelectedSeats.length === 0) return;
    setPaymentOpen(true);
  };

  const handleConfirmPurchase = () => {
    if (validSelectedSeats.length === 0) return;
    const dateObj =
      BOOKING_DATES.find((d) => d.id === selectedDateId) ?? BOOKING_DATES[0];
    const code = `CG-${Math.random()
      .toString(36)
      .substring(2, 7)
      .toUpperCase()}`;

    const record: BookingRecord = {
      id: `${Date.now()}`,
      movieId: movie.id,
      movieTitle: movie.title,
      poster: movie.poster,
      theatreName: selectedTheatre.name,
      location: selectedTheatre.location,
      dateLabel: `${dateObj.label}, ${dateObj.sub}`,
      time: selectedShowtime.time,
      format: selectedShowtime.format,
      seats: [...validSelectedSeats].sort(),
      totalAmount: totalPrice,
      bookedAt: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      ticketCode: code,
    };

    onConfirmBooking(record);
    setPaymentOpen(false);
    setConfirmedTicket(record);
  };

  const hallNumber =
    selectedTheatreId === 'cinego-imax-downtown'
      ? 'HALL 01'
      : selectedTheatreId === 'lumiere-grand-pavilion'
      ? 'HALL 04'
      : 'HALL 02';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 1.015 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.99 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-[45] overflow-y-auto bg-[#09090c] text-[#f3f3f6] cine-scrollbar"
    >
      {/* Full-bleed Upper Movie Backdrop dissolving seamlessly into #09090c */}
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[72vh] overflow-hidden">
        <motion.img
          key={movie.backdrop}
          initial={{ scale: 1.08, opacity: 0 }}
          animate={{ scale: 1.02, opacity: 0.48 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          src={movie.backdrop}
          alt=""
          className="h-full w-full object-cover object-top"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(9,9,12,0.55) 0%, rgba(9,9,12,0.42) 30%, rgba(9,9,12,0.88) 74%, #09090c 100%)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 75% 60% at 42% 20%, rgba(229,9,20,0.08), rgba(9,9,12,0.82) 78%)',
          }}
        />
        <div className="cine-grain absolute inset-0 opacity-45" />
      </div>

      {/* Top Navigation Header */}
      <header className="relative z-20 mx-auto flex h-[84px] max-w-[1360px] items-center justify-between px-5 sm:px-10">
        <button
          onClick={onBack}
          className="group flex items-center gap-3 text-left focus:outline-none cursor-pointer"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-white/80 group-hover:border-white/35 group-hover:text-white transition-all">
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          </span>
          <div className="flex flex-col">
            <span className="text-[13px] font-medium tracking-[0.12em] text-white/85 group-hover:text-white transition-colors">
              Back to Discovery
            </span>
            <span className="text-[11px] uppercase tracking-[0.18em] text-white/40">
              {location.city} · Let&rsquo;s go to the Movies
            </span>
          </div>
        </button>

        <button
          onClick={onBack}
          className="hidden sm:block font-display text-[48px] lg:text-[60px] leading-none tracking-[0.16em] text-[#e50914] drop-shadow-[0_0_24px_rgba(229,9,20,0.45)] cursor-pointer"
        >
          CINE GO
        </button>

        <div className="flex items-center gap-2.5">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-gradient-to-br from-zinc-700 via-zinc-800 to-black">
            <span className="text-xs font-semibold tracking-wider text-white/90">
              {isSignedIn
                ? userName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()
                : 'GP'}
            </span>
            <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full border border-[#09090c] bg-emerald-400" />
          </div>
          <span className="hidden sm:inline text-[14px] text-white/80">
            {isSignedIn ? userName : 'Guest Pass'}
          </span>
        </div>
      </header>

      {/* Main Two-Column Cinema Stage */}
      <main className="relative z-10 mx-auto grid max-w-[1260px] grid-cols-1 gap-10 px-5 pt-4 pb-12 sm:px-10 lg:grid-cols-12 lg:gap-12">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.48, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
          className="lg:col-span-8 flex flex-col"
        >
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-4xl sm:text-6xl tracking-[0.06em] text-white leading-none">
              {movie.title}{' '}
              <span className="font-sans text-lg sm:text-2xl font-light text-white/55">
                ({movie.releaseYear})
              </span>
            </h1>

            <span className="inline-flex items-center gap-1 rounded-[3px] bg-[#d4a853] px-2.5 py-1 text-xs font-bold tracking-wide text-black">
              <Star className="h-3.5 w-3.5 fill-black" />
              {movie.rating.toFixed(1)}/10
            </span>
          </div>

          <p className="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px] uppercase tracking-[0.16em] text-white/75">
            <span>{movie.ageRating}</span>
            <span className="text-white/25">|</span>
            <span>{movie.duration}</span>
            <span className="text-white/25">|</span>
            <span>{movie.genres.join(', ')}</span>
            <span className="text-white/25">|</span>
            <span>{movie.language}</span>
            <span className="text-white/25">|</span>
            <span className="text-white/90">{movie.releaseDate}</span>
          </p>

          <p className="mt-3 max-w-2xl text-[13.5px] sm:text-[15px] leading-relaxed text-white/70">
            {movie.synopsis}
          </p>

          <div className="my-5 h-px w-full bg-white/[0.1]" />

          {/* Inline Theatre / Date / Showtime Selectors + Seat Legend */}
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 flex-1">
              <label className="flex flex-col gap-1.5">
                <span className="text-[11.5px] uppercase tracking-[0.14em] text-white/50">
                  Theatre ({location.city})
                </span>
                <div className="relative">
                  <select
                    value={selectedTheatreId}
                    onChange={(e) => handleTheatreChange(e.target.value)}
                    className="w-full appearance-none rounded-[4px] border border-white/15 bg-[#121218]/80 px-3 py-2.5 pr-8 text-[13px] text-white/90 backdrop-blur-md focus:border-[#e50914] focus:outline-none cursor-pointer"
                  >
                    {localTheatres.map((t) => (
                      <option key={t.id} value={t.id} className="bg-[#121218]">
                        {t.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/45" />
                </div>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-[11.5px] uppercase tracking-[0.14em] text-white/50">
                  Date
                </span>
                <div className="relative">
                  <select
                    value={selectedDateId}
                    onChange={(e) => setSelectedDateId(e.target.value)}
                    className="w-full appearance-none rounded-[4px] border border-white/15 bg-[#121218]/80 px-3 py-2.5 pr-8 text-[13px] text-white/90 backdrop-blur-md focus:border-[#e50914] focus:outline-none cursor-pointer"
                  >
                    {BOOKING_DATES.map((d) => (
                      <option key={d.id} value={d.id} className="bg-[#121218]">
                        {d.label}, {d.sub}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/45" />
                </div>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-[11.5px] uppercase tracking-[0.14em] text-white/50">
                  Show Time
                </span>
                <div className="relative">
                  <select
                    value={selectedShowtime.id}
                    onChange={(e) => setSelectedShowtimeId(e.target.value)}
                    className="w-full appearance-none rounded-[4px] border border-white/15 bg-[#121218]/80 px-3 py-2.5 pr-8 text-[13px] text-white/90 backdrop-blur-md focus:border-[#e50914] focus:outline-none cursor-pointer"
                  >
                    {selectedTheatre.showtimes.map((st) => (
                      <option key={st.id} value={st.id} className="bg-[#121218]">
                        {st.time} · {st.format} (${st.price})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/45" />
                </div>
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-4 pb-1 text-xs text-white/70">
              <span className="flex items-center gap-1.5">
                <SeatIcon status="available" seatLabel="Available" />
                <span>Available</span>
              </span>
              <span className="flex items-center gap-1.5">
                <SeatIcon status="selected" seatLabel="Selected" />
                <span>Selected</span>
              </span>
              <span className="flex items-center gap-1.5">
                <SeatIcon status="booked" seatLabel="Booked" />
                <span>Booked</span>
              </span>
              <span className="flex items-center gap-1.5">
                <SeatIcon status="sold-out" seatLabel="Sold out" />
                <span>Sold out</span>
              </span>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[10px] uppercase tracking-[0.22em] text-white/35">
              {selectedTheatre.location} · {selectedTheatre.distance} ·{' '}
              {selectedShowtime.format}
            </span>
            {aiRecommendedSeats.length > 0 && (
              <button
                type="button"
                onClick={handleAiBestSeats}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#d4a853]/35 bg-[#d4a853]/10 px-3 py-1 text-[10.5px] font-medium text-[#e9c478] hover:bg-[#d4a853]/20 transition-colors cursor-pointer"
              >
                <Sparkles className="h-3 w-3" />
                <span>
                  AI Best Seat Pick ({aiRecommendedSeats.join(', ')})
                </span>
              </button>
            )}
          </div>

          {/* Amphitheater Cinema Seat Map (Row I -> Row A) */}
          <div className="mt-6 flex flex-col items-center overflow-x-auto no-scrollbar py-2">
            <div className="flex flex-col items-center gap-2.5 min-w-[460px]">
              {HALL_ROWS.map((row) => (
                <div
                  key={row.label}
                  className="flex w-full items-center justify-between gap-4 sm:gap-6"
                >
                  <span className="w-4 text-center text-[10px] font-medium text-white/40">
                    {row.label}
                  </span>

                  <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                    {Array.from({ length: row.count }, (_, idx) => {
                      const seatNum = idx + 1;
                      const seatId = `${row.label}${seatNum}`;
                      const baseState =
                        seatStatusMap.get(seatId) ?? 'available';
                      const isSelected = validSelectedSeats.includes(seatId);
                      const isAi =
                        !isSelected &&
                        baseState === 'available' &&
                        aiRecommendedSeats.includes(seatId);

                      const visualStatus = isSelected
                        ? 'selected'
                        : isAi
                        ? 'ai-pick'
                        : baseState;

                      return (
                        <button
                          key={seatId}
                          type="button"
                          disabled={baseState !== 'available'}
                          onClick={() => toggleSeat(seatId)}
                          title={
                            baseState === 'available'
                              ? `Row ${row.label} Seat ${seatNum} · $${selectedShowtime.price}${
                                  isAi ? ' (AI Sweet-Spot)' : ''
                                }`
                              : `Row ${row.label} Seat ${seatNum} (${baseState})`
                          }
                          className={`group relative rounded-[2px] p-0.5 transition-transform duration-150 focus:outline-none ${
                            baseState === 'available'
                              ? 'cursor-pointer hover:scale-115 active:scale-95'
                              : 'cursor-not-allowed'
                          }`}
                        >
                          <SeatIcon
                            status={visualStatus}
                            seatLabel={seatId}
                          />
                        </button>
                      );
                    })}
                  </div>

                  <span className="w-4 text-center text-[10px] font-medium text-white/40">
                    {row.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-7 flex w-full max-w-md flex-col items-center">
              <div className="h-[3px] w-4/5 rounded-full bg-gradient-to-r from-transparent via-white/35 to-transparent shadow-[0_0_20px_rgba(255,255,255,0.2)]" />
              <span className="mt-2 text-[9px] uppercase tracking-[0.38em] text-white/30">
                Cinema Screen
              </span>
            </div>
          </div>
        </motion.div>

        {/* RIGHT COLUMN: Poster + Trailer Button + Selected Seats Summary */}
        <motion.aside
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.14, ease: [0.22, 1, 0.36, 1] }}
          className="lg:col-span-4 flex flex-col items-center lg:items-stretch lg:pt-2"
        >
          <div className="relative mx-auto w-[210px] sm:w-[230px]">
            <div className="overflow-hidden rounded-[4px] border border-white/15 bg-[#121218] shadow-[0_24px_60px_rgba(0,0,0,0.85)] aspect-[9/14]">
              <img
                src={movie.poster}
                alt={movie.title}
                className="h-full w-full object-cover"
              />
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    'linear-gradient(180deg, transparent 60%, rgba(9,9,12,0.85) 100%)',
                }}
              />
            </div>

            <button
              type="button"
              onClick={() => setTrailerOpen(true)}
              className="group absolute -bottom-5 left-1/2 -translate-x-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-[#e50914] text-white shadow-[0_8px_24px_rgba(229,9,20,0.55)] ring-4 ring-[#09090c] hover:bg-[#f6121d] hover:scale-105 transition-all cursor-pointer"
              aria-label="Watch Trailer"
            >
              <Play className="h-4 w-4 fill-white translate-x-0.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setTrailerOpen(true)}
            className="mt-7 text-center text-[13px] font-medium tracking-[0.06em] text-white/65 hover:text-white transition-colors cursor-pointer"
          >
            Watch Trailer
          </button>

          <div className="mt-7 w-full rounded-xl border border-white/[0.07] bg-[#111116]/75 p-5 backdrop-blur-xl">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-white/90">
              Selected Seats
            </h2>

            <div className="mt-4 space-y-2.5 text-[13.5px]">
              <div className="flex items-center justify-between text-white/65">
                <span>Selection</span>
                <span className="font-semibold tracking-wider text-white/95">
                  {hallNumber} · {selectedShowtime.format}
                </span>
              </div>

              <AnimatePresence initial={false}>
                {validSelectedSeats.length === 0 ? (
                  <p className="py-2 text-xs text-white/45">
                    Tap available seats on the hall map to reserve.
                  </p>
                ) : (
                  [...validSelectedSeats].sort().map((seatId) => (
                    <motion.div
                      key={seatId}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 8 }}
                      transition={{ duration: 0.18 }}
                      className="flex items-center justify-between text-white/85"
                    >
                      <span>{formatSeatLine(seatId)}</span>
                      <span className="font-medium text-white">
                        ${selectedShowtime.price}
                      </span>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>

            <div className="my-4 h-px w-full bg-white/[0.08]" />

            <div className="flex items-center justify-between">
              <span className="text-[13px] text-white/60">Total</span>
              <span className="text-xl font-semibold tracking-wide text-[#d4a853]">
                ${totalPrice}
              </span>
            </div>

            <button
              type="button"
              disabled={validSelectedSeats.length === 0}
              onClick={handleProceedToPayment}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-[4px] bg-[#e50914] py-3 text-[13px] font-semibold uppercase tracking-[0.18em] text-white shadow-[0_10px_28px_rgba(229,9,20,0.4)] hover:bg-[#f6121d] active:scale-[0.99] disabled:opacity-35 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <Ticket className="h-4 w-4" />
              <span>Proceed to Pay</span>
            </button>
          </div>
        </motion.aside>
      </main>

      {/* Payment QR Section Modal */}
      <PaymentSectionModal
        isOpen={paymentOpen}
        movie={movie}
        theatreName={selectedTheatre.name}
        location={selectedTheatre.location}
        dateLabel={`${
          (BOOKING_DATES.find((d) => d.id === selectedDateId) ?? BOOKING_DATES[0])
            .label
        }, ${
          (BOOKING_DATES.find((d) => d.id === selectedDateId) ?? BOOKING_DATES[0])
            .sub
        }`}
        time={selectedShowtime.time}
        format={selectedShowtime.format}
        seats={validSelectedSeats}
        totalAmount={totalPrice}
        onClose={() => setPaymentOpen(false)}
        onPaymentSuccess={handleConfirmPurchase}
      />

      {/* Trailer Modal */}
      <AnimatePresence>
        {trailerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-5 backdrop-blur-xl"
            onClick={() => setTrailerOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-2xl overflow-hidden rounded-xl border border-white/15 bg-[#0a0a0e] shadow-2xl"
            >
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
                <div className="pointer-events-none absolute top-0 inset-x-0 h-7 bg-black" />
                <div className="pointer-events-none absolute bottom-0 inset-x-0 h-7 bg-black" />
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/35 px-6 text-center">
                  <span className="text-[10px] uppercase tracking-[0.32em] text-[#d4a853]">
                    CINE GO EXCLUSIVE PREVIEW
                  </span>
                  <h3 className="mt-2 font-display text-4xl sm:text-5xl tracking-[0.12em] text-white">
                    {movie.title}
                  </h3>
                  <p className="mt-2 max-w-md text-xs text-white/75">
                    {movie.trailerPreviewTagline}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instant Digital Pass Confirmation Overlay */}
      <AnimatePresence>
        {confirmedTicket && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-5 backdrop-blur-xl"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex w-full max-w-md flex-col items-center rounded-xl border border-white/15 bg-[#101016] p-6 text-center shadow-2xl"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h3 className="mt-3 font-display text-3xl tracking-[0.1em] text-white">
                TICKETS CONFIRMED
              </h3>
              <p className="mt-1 text-xs text-white/55">
                Saved to your CINE GO digital wallet.
              </p>

              <div className="mt-5 flex w-full items-center gap-3 overflow-hidden rounded-lg border border-white/12 bg-[#16161f] p-3.5 text-left">
                <div className="flex-1 space-y-1.5 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#e50914]">
                      CINE GO PASS
                    </span>
                    <span className="font-mono text-[10px] text-white/65">
                      {confirmedTicket.ticketCode}
                    </span>
                  </div>
                  <h4 className="truncate text-sm font-semibold text-white">
                    {confirmedTicket.movieTitle}
                  </h4>
                  <p className="truncate text-[11px] text-white/60">
                    {confirmedTicket.theatreName}
                  </p>
                  <p className="text-[11px] text-white/85">
                    {confirmedTicket.dateLabel} · {confirmedTicket.time}
                  </p>
                  <p className="text-[11px] text-[#d4a853] font-medium">
                    Seats: {confirmedTicket.seats.join(', ')} ($
                    {confirmedTicket.totalAmount})
                  </p>
                </div>
                <div className="shrink-0 rounded-md bg-[#f7f7fa] p-1.5">
                  <QrCodeImage booking={confirmedTicket} size={82} />
                </div>
              </div>

              <div className="mt-6 flex w-full gap-3">
                <button
                  onClick={() => {
                    setConfirmedTicket(null);
                    onBack();
                  }}
                  className="flex-1 rounded-[4px] border border-white/15 py-2.5 text-xs font-medium uppercase tracking-[0.14em] text-white/80 hover:text-white transition-colors cursor-pointer"
                >
                  Discovery
                </button>
                <button
                  onClick={() => {
                    setConfirmedTicket(null);
                    onViewMyBookings();
                  }}
                  className="flex-1 rounded-[4px] bg-[#e50914] py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-white hover:bg-[#f6121d] transition-colors cursor-pointer"
                >
                  My Bookings
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
