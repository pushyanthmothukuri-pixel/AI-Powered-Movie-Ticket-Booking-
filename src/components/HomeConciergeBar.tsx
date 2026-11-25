import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronDown,
  Clock,
  Loader2,
  LocateFixed,
  MapPin,
  MonitorPlay,
  Send,
  Sparkles,
  Star,
  Ticket,
  X,
} from 'lucide-react';
import {
  AiTheatrePick,
  detectCurrentLocation,
  PRESET_LOCATIONS,
  UserLocation,
} from '../services/locationAndAi';
import { askGeminiConcierge, GeminiAiResult } from '../services/geminiAi';
import { Movie } from '../types/cinema';

interface HomeConciergeBarProps {
  location: UserLocation;
  onChangeLocation: (loc: UserLocation) => void;
  preferredFormat: string;
  onSelectMovieDetails: (movie: Movie) => void;
  onReserveAiPick: (movie: Movie, pick: AiTheatrePick) => void;
  onReturnHome: () => void;
  onNavigateHint: (
    hint: 'open-bookings' | 'open-mylist' | 'open-coming-soon'
  ) => void;
}

const SAMPLE_PROMPTS = [
  'Orbit Zero',
  'Interstellar',
  'Best IMAX thriller tonight?',
  'Any Japanese movies showing?',
];

export const HomeConciergeBar: React.FC<HomeConciergeBarProps> = ({
  location,
  onChangeLocation,
  preferredFormat,
  onSelectMovieDetails,
  onReserveAiPick,
  onReturnHome,
  onNavigateHint,
}) => {
  const [locationMenuOpen, setLocationMenuOpen] = useState(false);
  const [detectingGps, setDetectingGps] = useState(false);
  const [gpsFeedback, setGpsFeedback] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [isAskingAi, setIsAskingAi] = useState(false);
  const [aiResponse, setAiResponse] = useState<GeminiAiResult | null>(null);

  const locDropdownRef = useRef<HTMLDivElement>(null);
  const aiAreaRef = useRef<HTMLDivElement>(null);

  const closeAiAndReturnHome = () => {
    setAiResponse(null);
    setIsAskingAi(false);
    onReturnHome();
  };

  // Close Location menu OR AI section when clicking anywhere outside them
  useEffect(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        locDropdownRef.current &&
        !locDropdownRef.current.contains(target)
      ) {
        setLocationMenuOpen(false);
      }
      if (
        (aiResponse || isAskingAi) &&
        aiAreaRef.current &&
        !aiAreaRef.current.contains(target)
      ) {
        setAiResponse(null);
        setIsAskingAi(false);
        onReturnHome();
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && (aiResponse || isAskingAi)) {
        setAiResponse(null);
        setIsAskingAi(false);
        onReturnHome();
      }
    };

    document.addEventListener('mousedown', onDocMouseDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [aiResponse, isAskingAi, onReturnHome]);

  const handleDetectLocation = async () => {
    setDetectingGps(true);
    setGpsFeedback(null);
    try {
      const detected = await detectCurrentLocation();
      onChangeLocation(detected);
      setLocationMenuOpen(false);
      setGpsFeedback(`Location updated to ${detected.label}`);
      if (aiResponse && query.trim()) {
        void handleAskAi(query, detected);
      }
    } catch {
      setGpsFeedback(
        'Location permission unavailable — select a city below.'
      );
    } finally {
      setDetectingGps(false);
    }
  };

  const handleAskAi = async (
    promptText?: string,
    overrideLocation?: UserLocation
  ) => {
    const activePrompt = (promptText ?? query).trim();
    if (!activePrompt) {
      closeAiAndReturnHome();
      return;
    }
    if (isAskingAi) return;
    if (promptText) setQuery(promptText);

    setIsAskingAi(true);
    try {
      const result = await askGeminiConcierge(
        activePrompt,
        overrideLocation ?? location,
        preferredFormat
      );
      if (result.actionHint) {
        setAiResponse(null);
        onNavigateHint(result.actionHint);
        return;
      }
      setAiResponse(result);
    } finally {
      setIsAskingAi(false);
    }
  };

  return (
    <div className="relative z-20 mb-3.5 flex flex-col gap-2.5">
      {/* Top Row: Location Picker Pill + AI Area */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Location Selector + Live GPS Fetch */}
        <div ref={locDropdownRef} className="relative flex items-center gap-2">
          <button
            type="button"
            onClick={() => setLocationMenuOpen((prev) => !prev)}
            className="flex items-center gap-2 rounded-full border border-white/14 bg-[#111117]/85 px-4 py-2 text-[14px] text-white/90 backdrop-blur-xl hover:border-white/30 hover:text-white transition-all cursor-pointer"
          >
            <MapPin className="h-4 w-4 text-[#e50914]" />
            <span className="max-w-[220px] truncate font-medium tracking-wide">
              {location.label}
            </span>
            {location.isLiveGps && (
              <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10.5px] uppercase tracking-wider text-emerald-300">
                GPS
              </span>
            )}
            <ChevronDown
              className={`h-4 w-4 text-white/50 transition-transform ${
                locationMenuOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          <button
            type="button"
            onClick={handleDetectLocation}
            disabled={detectingGps}
            title="Fetch my current location"
            className="flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.04] px-3.5 py-2 text-[13px] text-white/75 hover:border-white/30 hover:text-white disabled:opacity-50 transition-all cursor-pointer"
          >
            {detectingGps ? (
              <Loader2 className="h-4 w-4 animate-spin text-[#d4a853]" />
            ) : (
              <LocateFixed className="h-4 w-4 text-[#d4a853]" />
            )}
            <span className="hidden sm:inline">
              {detectingGps ? 'Locating...' : 'Use My Location'}
            </span>
          </button>

          {/* Location Dropdown */}
          <AnimatePresence>
            {locationMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.97 }}
                transition={{ duration: 0.18 }}
                className="absolute left-0 top-12 z-40 w-72 rounded-xl border border-white/12 bg-[#111118]/95 p-2 shadow-[0_20px_50px_rgba(0,0,0,0.85)] backdrop-blur-2xl"
              >
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={detectingGps}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-[13.5px] font-medium text-[#d4a853] hover:bg-white/[0.06] transition-colors cursor-pointer"
                >
                  <LocateFixed className="h-4 w-4" />
                  <span>
                    {detectingGps
                      ? 'Detecting GPS location...'
                      : 'Fetch Current GPS Location'}
                  </span>
                </button>
                <div className="my-1 h-px bg-white/[0.07]" />
                {PRESET_LOCATIONS.map((loc) => {
                  const active = loc.id === location.id;
                  return (
                    <button
                      key={loc.id}
                      type="button"
                      onClick={() => {
                        onChangeLocation(loc);
                        setLocationMenuOpen(false);
                        setGpsFeedback(null);
                        if (aiResponse && query.trim()) {
                          void handleAskAi(query, loc);
                        }
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-[13.5px] transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#e50914]/15 text-white'
                          : 'text-white/80 hover:bg-white/[0.05] hover:text-white'
                      }`}
                    >
                      <span>{loc.label}</span>
                      {active && (
                        <span className="h-2 w-2 rounded-full bg-[#e50914]" />
                      )}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Entire AI Area Ref (input + chips + floating response panel) */}
        <div ref={aiAreaRef} className="relative flex-1 max-w-2xl">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleAskAi();
            }}
            className="flex w-full items-center gap-2.5 rounded-full border border-white/15 bg-[#111117]/85 px-4 py-2 backdrop-blur-xl focus-within:border-[#e50914]/75 transition-colors"
          >
            {isAskingAi ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#d4a853]" />
            ) : (
              <Sparkles className="h-4 w-4 shrink-0 text-[#d4a853]" />
            )}
            <input
              type="text"
              value={query}
              onChange={(e) => {
                const val = e.target.value;
                setQuery(val);
                if (!val.trim()) {
                  closeAiAndReturnHome();
                }
              }}
              placeholder="Enter any movie name or question for timings, best screen & vacant seats..."
              className="w-full bg-transparent text-[14.5px] text-white placeholder:text-white/40 focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  closeAiAndReturnHome();
                }}
                className="text-white/45 hover:text-white cursor-pointer"
                aria-label="Clear AI prompt"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <button
              type="submit"
              disabled={isAskingAi}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e50914] text-white hover:bg-[#f6121d] disabled:opacity-50 transition-colors cursor-pointer"
              aria-label="Ask CINE GO Gemini AI"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>

          {/* AI Concierge Floating Results Panel */}
          <AnimatePresence>
            {(isAskingAi || aiResponse) && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="fixed left-4 right-4 md:left-[104px] md:right-8 lg:left-[264px] lg:right-[60px] xl:right-[210px] top-[198px] lg:top-[182px] z-40 max-h-[68vh] overflow-y-auto rounded-2xl border border-white/15 bg-[#0c0c12]/96 p-5 sm:p-6 shadow-[0_32px_90px_rgba(0,0,0,0.95)] backdrop-blur-2xl cine-scrollbar"
              >
                {isAskingAi ? (
                  <div className="flex items-center gap-3 py-4 text-[15px] text-white/80">
                    <Loader2 className="h-5 w-5 animate-spin text-[#d4a853]" />
                    <span>
                      Checking show timings, best screen, and vacant seating in{' '}
                      <strong className="text-white">{location.city}</strong>...
                    </span>
                  </div>
                ) : aiResponse ? (
                  <>
                    <button
                      type="button"
                      onClick={closeAiAndReturnHome}
                      className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/60 hover:border-white/30 hover:text-white transition-colors cursor-pointer"
                      aria-label="Close AI section"
                    >
                      <X className="h-4 w-4" />
                    </button>

                    <div className="flex flex-col gap-5 md:flex-row md:items-start">
                      {aiResponse.matchedMovie && (
                        <button
                          type="button"
                          onClick={() => {
                            const movie = aiResponse.matchedMovie!;
                            setAiResponse(null);
                            onSelectMovieDetails(movie);
                          }}
                          className="group relative hidden sm:block w-28 shrink-0 aspect-[9/14] overflow-hidden rounded-[4px] border border-white/15 cursor-pointer"
                        >
                          <img
                            src={aiResponse.matchedMovie.poster}
                            alt={aiResponse.matchedMovie.title}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </button>
                      )}

                      <div className="flex-1 pr-8">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="inline-flex items-center gap-1.5 rounded bg-[#d4a853]/15 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#e9c478]">
                            <Sparkles className="h-3.5 w-3.5" />
                            {aiResponse.poweredBy === 'gemini'
                              ? 'Gemini AI'
                              : 'CINE GO AI'}
                          </span>
                          {aiResponse.matchedMovie && (
                            <span className="inline-flex items-center gap-1 text-[13px] font-medium text-[#d4a853]">
                              <Star className="h-3.5 w-3.5 fill-[#d4a853]" />
                              {aiResponse.matchedMovie.rating.toFixed(1)} ·{' '}
                              {aiResponse.matchedMovie.language}
                            </span>
                          )}
                        </div>

                        <h3 className="mt-2 text-xl sm:text-2xl font-semibold tracking-wide text-white">
                          {aiResponse.headline}
                        </h3>
                        <p className="mt-1.5 text-[14.5px] leading-relaxed text-white/80">
                          {aiResponse.summary}
                        </p>

                        {/* Best Screen Recommendation Callout */}
                        {aiResponse.bestScreen && (
                          <div className="mt-3.5 flex items-start gap-2.5 rounded-lg border border-[#d4a853]/30 bg-[#d4a853]/10 px-3.5 py-2.5">
                            <MonitorPlay className="mt-0.5 h-4 w-4 shrink-0 text-[#e9c478]" />
                            <div className="text-[13.5px]">
                              <span className="font-semibold text-[#e9c478]">
                                Best Screen to Watch: {aiResponse.bestScreen}
                              </span>
                              {aiResponse.bestScreenReason && (
                                <p className="mt-0.5 text-white/75">
                                  {aiResponse.bestScreenReason}
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Multiple suggested films if applicable */}
                        {aiResponse.suggestedMovies &&
                          aiResponse.suggestedMovies.length > 1 && (
                            <div className="mt-3.5 flex flex-wrap gap-2">
                              {aiResponse.suggestedMovies.map((m) => (
                                <button
                                  key={m.id}
                                  type="button"
                                  onClick={() => {
                                    setAiResponse(null);
                                    onSelectMovieDetails(m);
                                  }}
                                  className="inline-flex items-center gap-2 rounded-full border border-white/14 bg-white/[0.05] px-3.5 py-1.5 text-[13px] text-white/90 hover:border-white/35 hover:text-white transition-colors cursor-pointer"
                                >
                                  <span className="font-medium">{m.title}</span>
                                  <span className="text-[#d4a853]">
                                    ★ {m.rating.toFixed(1)}
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}

                        {/* Nearby Theatres, Show Timings & Best Vacant Seats */}
                        {aiResponse.theatrePicks && aiResponse.matchedMovie && (
                          <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
                            {aiResponse.theatrePicks.map((pick) => (
                              <div
                                key={pick.theatre.id}
                                className="flex flex-col justify-between rounded-xl border border-white/12 bg-white/[0.03] p-4"
                              >
                                <div>
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-[14.5px] font-semibold text-white truncate">
                                      {pick.theatre.name}
                                    </span>
                                    <span className="text-xs text-white/50 shrink-0">
                                      {pick.theatre.distance}
                                    </span>
                                  </div>
                                  <p className="mt-0.5 text-[12.5px] text-white/55">
                                    {pick.theatre.location}
                                  </p>

                                  {/* All Show Timings for today */}
                                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                                    {pick.allShowtimes.map((st) => (
                                      <button
                                        key={st.id}
                                        type="button"
                                        onClick={() => {
                                          const movie = aiResponse.matchedMovie!;
                                          setAiResponse(null);
                                          onReserveAiPick(movie, {
                                            theatre: pick.theatre,
                                            showtime: {
                                              id: st.id,
                                              time: st.time,
                                              format: st.format,
                                              price: st.price,
                                            },
                                            bestSeats: st.bestSeats,
                                            reason: `${st.format} · ${st.vacantCount} vacant`,
                                          });
                                        }}
                                        className="inline-flex items-center gap-1 rounded border border-white/12 bg-[#14141d] px-2 py-1 text-[11.5px] text-white/85 hover:border-[#e50914] hover:text-white transition-colors cursor-pointer"
                                        title={`${st.format} · ${st.vacantCount} vacant seats`}
                                      >
                                        <Clock className="h-3 w-3 text-[#e50914]" />
                                        <span>{st.time}</span>
                                        <span className="text-white/45">
                                          {st.format.split(' ')[0]}
                                        </span>
                                      </button>
                                    ))}
                                  </div>

                                  {/* Best Vacant Seats & Availability */}
                                  <div className="mt-3 rounded-lg bg-black/35 px-2.5 py-2 text-[12.5px]">
                                    <p className="font-medium text-[#e9c478]">
                                      Best Vacant Seats: {pick.bestSeats.join(', ')}
                                    </p>
                                    <p className="text-white/55">
                                      {pick.vacantCount} vacant seats ·{' '}
                                      {pick.showtime.format} ({pick.showtime.time})
                                    </p>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => {
                                    const movie = aiResponse.matchedMovie!;
                                    setAiResponse(null);
                                    onReserveAiPick(movie, pick);
                                  }}
                                  className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-[4px] bg-[#e50914] py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white hover:bg-[#f6121d] transition-colors cursor-pointer"
                                >
                                  <Ticket className="h-3.5 w-3.5" />
                                  <span>Reserve Best Vacant Seats</span>
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                ) : null}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Quick Prompts + GPS Status */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-[0.16em] text-white/45 mr-1">
            Gemini AI:
          </span>
          {SAMPLE_PROMPTS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => void handleAskAi(chip)}
              className="rounded-full border border-white/12 bg-white/[0.04] px-3 py-1 text-[12.5px] text-white/75 hover:border-white/30 hover:text-white transition-colors cursor-pointer"
            >
              {chip}
            </button>
          ))}
        </div>

        {gpsFeedback && (
          <span className="text-[13px] text-[#d4a853]">{gpsFeedback}</span>
        )}
      </div>
    </div>
  );
};
