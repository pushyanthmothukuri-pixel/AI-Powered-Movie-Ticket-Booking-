import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CATEGORIES, MOVIES } from './data/movies';
import {
  BookingRecord,
  CategoryId,
  Movie,
  NavSection,
} from './types/cinema';
import {
  AiTheatrePick,
  PRESET_LOCATIONS,
  UserLocation,
} from './services/locationAndAi';
import { AmbientBackdrop } from './components/AmbientBackdrop';
import { SidebarNav } from './components/SidebarNav';
import { TopBar } from './components/TopBar';
import {
  GallerySliceItem,
  VerticalPosterGallery,
} from './components/VerticalPosterGallery';
import { HomeConciergeBar } from './components/HomeConciergeBar';
import { SearchOverlay } from './components/SearchOverlay';
import { MovieDetailModal } from './components/MovieDetailModal';
import { BookingSessionView } from './components/BookingSessionView';
import {
  MyBookingsView,
  MyListView,
} from './components/BookingsAndListView';
import { AccountSettingsModal } from './components/AccountSettingsModal';
import { OtpLoginView } from './components/OtpLoginView';

interface BookingPreset {
  movie: Movie;
  theatreId?: string;
  showtimeId?: string;
  seats?: string[];
}

export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userPhone, setUserPhone] = useState('');

  const [activeSection, setActiveSection] = useState<NavSection>('home');
  const [selectedCategoryId, setSelectedCategoryId] =
    useState<CategoryId | null>(null);
  const [hoveredSlice, setHoveredSlice] = useState<GallerySliceItem | null>(
    null
  );

  const [location, setLocation] = useState<UserLocation>(PRESET_LOCATIONS[0]);

  const [searchOpen, setSearchOpen] = useState(false);
  const [detailMovie, setDetailMovie] = useState<Movie | null>(null);
  const [bookingPreset, setBookingPreset] = useState<BookingPreset | null>(
    null
  );
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [userName, setUserName] = useState('Jeremy Soul');
  const [preferredFormat, setPreferredFormat] = useState('IMAX 2D');

  const [myListIds, setMyListIds] = useState<string[]>([
    'orbit-zero',
    'the-gilded-crown',
  ]);

  const [bookings, setBookings] = useState<BookingRecord[]>([
    {
      id: 'sample-pass-1',
      movieId: 'orbit-zero',
      movieTitle: 'Orbit Zero',
      poster: '/posters/scifi.jpg',
      theatreName: 'CINE GO Luxe IMAX',
      location: 'Indiranagar Luxe',
      dateLabel: 'Today, Nov 25',
      time: '21:10',
      format: 'IMAX 2D',
      seats: ['G8', 'G9'],
      totalAmount: 40,
      bookedAt: '16:20',
      ticketCode: 'CG-8492A',
    },
  ]);

  // Distinguish HOME (AI Spotlight & Now Showing movies near user) from CATEGORIES (8 genre portals)
  const galleryItems: GallerySliceItem[] = useMemo(() => {
    const showCategories =
      activeSection === 'categories' && selectedCategoryId === null;

    if (showCategories) {
      return CATEGORIES.map((cat) => ({
        id: cat.id,
        kind: 'category',
        title: cat.label,
        subtitle: cat.tagline,
        poster: cat.poster,
        staggerY: cat.staggerY,
        ambientColor: cat.ambientColor,
        categoryRef: cat,
      }));
    }

    let filtered = MOVIES;
    if (selectedCategoryId) {
      filtered = MOVIES.filter((m) => m.categoryId === selectedCategoryId);
    } else if (activeSection === 'home') {
      // Home displays curated AI Spotlight films playing nearby
      filtered = MOVIES.filter((m) => m.status === 'now-showing');
    } else if (activeSection === 'now-showing') {
      filtered = MOVIES.filter((m) => m.status === 'now-showing');
    } else if (activeSection === 'coming-soon') {
      filtered = MOVIES.filter((m) => m.status === 'coming-soon');
    } else if (activeSection === 'movies') {
      // Movies highlights all premieres & top-rated catalog (mix of now-showing & coming-soon)
      filtered = [...MOVIES]
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 8);
    }

    return filtered.map((m, idx) => ({
      id: m.id,
      kind: 'movie',
      title: m.title,
      subtitle: `${m.genres[0]} · ${m.language}`,
      poster: m.poster,
      staggerY: m.staggerY ?? (idx % 2 === 0 ? -14 : 14),
      ambientColor: m.ambientColor,
      rating: m.rating,
      status: m.status,
      language: m.language,
      duration: m.duration,
      movieRef: m,
    }));
  }, [activeSection, selectedCategoryId]);

  const activeCategoryObj = useMemo(
    () => CATEGORIES.find((c) => c.id === selectedCategoryId) ?? null,
    [selectedCategoryId]
  );

  // Determine reactive ambient backdrop
  const backdropImage =
    bookingPreset?.movie.backdrop ??
    detailMovie?.backdrop ??
    hoveredSlice?.poster ??
    galleryItems[4]?.poster ??
    galleryItems[0]?.poster ??
    '/posters/drama.jpg';

  const ambientTint =
    bookingPreset?.movie.ambientColor ??
    detailMovie?.ambientColor ??
    hoveredSlice?.ambientColor ??
    galleryItems[4]?.ambientColor ??
    'rgba(182, 158, 132, 0.18)';

  const handleSelectNavSection = (section: NavSection) => {
    setActiveSection(section);
    setSelectedCategoryId(null);
    setHoveredSlice(null);
    setBookingPreset(null);
  };

  const handleSelectGalleryItem = (item: GallerySliceItem) => {
    if (item.kind === 'category' && item.categoryRef) {
      setSelectedCategoryId(item.categoryRef.id);
      setHoveredSlice(null);
      return;
    }
    if (item.kind === 'movie' && item.movieRef) {
      setDetailMovie(item.movieRef);
    }
  };

  const handleToggleMyList = (movieId: string) => {
    setMyListIds((prev) =>
      prev.includes(movieId)
        ? prev.filter((id) => id !== movieId)
        : [...prev, movieId]
    );
  };

  const handleReserveAiPick = (movie: Movie, pick: AiTheatrePick) => {
    setBookingPreset({
      movie,
      theatreId: pick.theatre.id,
      showtimeId: pick.showtime.id,
      seats: pick.bestSeats,
    });
  };

  const myListMovies = useMemo(
    () => MOVIES.filter((m) => myListIds.includes(m.id)),
    [myListIds]
  );

  const galleryHeading = useMemo(() => {
    if (activeCategoryObj) return activeCategoryObj.label;
    if (activeSection === 'categories') return 'Browse by Genre';
    if (activeSection === 'movies') return 'Top Rated Cinema';
    if (activeSection === 'now-showing') return 'Now Showing in Theatres';
    if (activeSection === 'coming-soon') return 'Upcoming Premieres';
    return undefined;
  }, [activeCategoryObj, activeSection]);

  const gallerySubheading = useMemo(() => {
    if (activeCategoryObj) return activeCategoryObj.tagline;
    if (activeSection === 'categories')
      return 'Select a genre portal to explore matching releases';
    if (activeSection === 'movies')
      return 'Critically acclaimed picks across all languages & formats';
    if (activeSection === 'now-showing')
      return `Showing in ${preferredFormat} & Dolby Atmos in ${location.city}`;
    if (activeSection === 'coming-soon')
      return 'Pre-booking alerts & early IMAX seat reservations';
    return undefined;
  }, [activeCategoryObj, activeSection, preferredFormat, location.city]);

  const stageKey = `${activeSection}-${selectedCategoryId ?? 'root'}`;

  return (
    <AnimatePresence mode="wait">
      {!isAuthenticated ? (
        <OtpLoginView
          key="otp-login-gate"
          onSuccess={(phoneDisplay) => {
            setUserPhone(phoneDisplay);
            setActiveSection('home');
            setSelectedCategoryId(null);
            setIsAuthenticated(true);
          }}
        />
      ) : (
        <motion.div
          key="cine-go-main-shell"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
          className="relative h-screen w-screen overflow-hidden bg-[#09090c] text-[#f3f3f6]"
        >
          {/* Full-viewport atmospheric dark background */}
          <AmbientBackdrop
            imageSrc={backdropImage}
            ambientTint={ambientTint}
          />

          {/* Minimal Left Sidebar Navigation */}
          <SidebarNav
            activeSection={activeSection}
            onSelectSection={handleSelectNavSection}
            onOpenSearch={() => setSearchOpen(true)}
            bookingsCount={bookings.length}
            myListCount={myListIds.length}
          />

          {/* Centered CINE GO Wordmark & Top-Right User Profile */}
          <TopBar
            onGoHome={() => handleSelectNavSection('home')}
            onOpenSearch={() => setSearchOpen(true)}
            onSelectSection={handleSelectNavSection}
            onOpenAccountSettings={() => setSettingsOpen(true)}
            userName={userName}
            isSignedIn={isAuthenticated}
            onToggleSignIn={() => {
              setIsAuthenticated(false);
              setBookingPreset(null);
              setDetailMovie(null);
            }}
          />

          {/* Main Content Stage with smooth AnimatePresence transitions across sidebar states */}
          <main className="relative h-full w-full">
            <AnimatePresence mode="wait">
              {activeSection === 'my-bookings' ? (
                <motion.div
                  key="stage-my-bookings"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full w-full"
                >
                  <MyBookingsView
                    bookings={bookings}
                    onCancelBooking={(id) =>
                      setBookings((prev) => prev.filter((b) => b.id !== id))
                    }
                    onExploreNowShowing={() =>
                      handleSelectNavSection('now-showing')
                    }
                  />
                </motion.div>
              ) : activeSection === 'my-list' ? (
                <motion.div
                  key="stage-my-list"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full w-full"
                >
                  <MyListView
                    movies={myListMovies}
                    onSelectMovie={(m) => setDetailMovie(m)}
                    onRemoveFromList={(id) => handleToggleMyList(id)}
                    onExploreMovies={() => handleSelectNavSection('movies')}
                  />
                </motion.div>
              ) : (
                <VerticalPosterGallery
                  key={stageKey}
                  items={galleryItems}
                  heading={galleryHeading}
                  subheading={gallerySubheading}
                  canGoBack={selectedCategoryId !== null}
                  onGoBack={() => setSelectedCategoryId(null)}
                  onHoverItem={setHoveredSlice}
                  onSelectItem={handleSelectGalleryItem}
                  headerSlot={
                    activeSection === 'home' && selectedCategoryId === null ? (
                      <HomeConciergeBar
                        location={location}
                        onChangeLocation={setLocation}
                        preferredFormat={preferredFormat}
                        onSelectMovieDetails={(m) => setDetailMovie(m)}
                        onReserveAiPick={handleReserveAiPick}
                        onReturnHome={() => {
                          setActiveSection('home');
                          setSelectedCategoryId(null);
                        }}
                        onNavigateHint={(hint) => {
                          if (hint === 'open-bookings') {
                            handleSelectNavSection('my-bookings');
                          } else if (hint === 'open-mylist') {
                            handleSelectNavSection('my-list');
                          } else {
                            handleSelectNavSection('coming-soon');
                          }
                        }}
                      />
                    ) : undefined
                  }
                />
              )}
            </AnimatePresence>
          </main>

          {/* Search Interface */}
          <SearchOverlay
            isOpen={searchOpen}
            onClose={() => setSearchOpen(false)}
            onSelectMovie={(movie) => setDetailMovie(movie)}
          />

          {/* Cinematic Movie Details Experience */}
          <MovieDetailModal
            movie={detailMovie}
            isInMyList={
              detailMovie ? myListIds.includes(detailMovie.id) : false
            }
            onToggleMyList={handleToggleMyList}
            onClose={() => setDetailMovie(null)}
            onBookTickets={(movie) => {
              setBookingPreset({ movie });
              setDetailMovie(null);
            }}
          />

          {/* Full-Screen Seamless Ticket Booking Session */}
          <AnimatePresence>
            {bookingPreset && (
              <BookingSessionView
                movie={bookingPreset.movie}
                location={location}
                userName={userPhone ? `${userName}` : userName}
                isSignedIn={isAuthenticated}
                preferredFormat={preferredFormat}
                initialTheatreId={bookingPreset.theatreId}
                initialShowtimeId={bookingPreset.showtimeId}
                initialSeats={bookingPreset.seats}
                onBack={() => setBookingPreset(null)}
                onConfirmBooking={(newBooking) =>
                  setBookings((prev) => [newBooking, ...prev])
                }
                onViewMyBookings={() => {
                  setBookingPreset(null);
                  setActiveSection('my-bookings');
                }}
              />
            )}
          </AnimatePresence>

          {/* Account Settings Modal */}
          <AccountSettingsModal
            isOpen={settingsOpen}
            onClose={() => setSettingsOpen(false)}
            userName={userName}
            onUpdateUserName={setUserName}
            preferredFormat={preferredFormat}
            onUpdatePreferredFormat={setPreferredFormat}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default App;
