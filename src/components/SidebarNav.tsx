import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bookmark,
  CalendarClock,
  Film,
  Flame,
  Grid,
  Home,
  Search,
  Ticket,
} from 'lucide-react';
import { NavSection } from '../types/cinema';

interface SidebarNavProps {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  onOpenSearch: () => void;
  bookingsCount: number;
  myListCount: number;
}

const NAV_ITEMS: {
  id: NavSection;
  label: string;
  icon: React.FC<{ className?: string }>;
}[] = [
  { id: 'home', label: 'HOME', icon: Home },
  { id: 'movies', label: 'MOVIES', icon: Film },
  { id: 'now-showing', label: 'NOW SHOWING', icon: Flame },
  { id: 'coming-soon', label: 'COMING SOON', icon: CalendarClock },
  { id: 'categories', label: 'CATEGORIES', icon: Grid },
  { id: 'my-bookings', label: 'MY BOOKINGS', icon: Ticket },
  { id: 'my-list', label: 'MY LIST', icon: Bookmark },
];

export const SidebarNav: React.FC<SidebarNavProps> = ({
  activeSection,
  onSelectSection,
  onOpenSearch,
  bookingsCount,
  myListCount,
}) => {
  const [hoveredId, setHoveredId] = useState<NavSection | null>(null);
  const hoveredIndex = NAV_ITEMS.findIndex((i) => i.id === hoveredId);
  const hasAnyHover = hoveredId !== null;

  return (
    <>
      {/* Desktop & Tablet Left Vertical Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 z-30 w-[82px] lg:w-[242px] flex-col justify-between py-7 px-4 lg:px-7 select-none">
        {/* Top section: App logo + Search trigger */}
        <div className="flex flex-col gap-6">
          <button
            onClick={() => onSelectSection('home')}
            className="group flex items-center gap-2.5 text-left focus:outline-none cursor-pointer"
            aria-label="CINE GO Home"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-[#e50914]/90 text-white shadow-[0_0_16px_rgba(229,9,20,0.45)] transition-transform duration-300 group-hover:scale-105">
              <span className="font-display text-lg tracking-wider leading-none pt-0.5">
                CG
              </span>
            </div>
            <div className="hidden lg:flex flex-col">
              <span className="text-[14px] font-semibold tracking-[0.24em] text-white/95 group-hover:text-white transition-colors">
                CINE GO
              </span>
              <span className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                AI Cinema
              </span>
            </div>
          </button>

          {/* Search button matching reference top-left placement */}
          <button
            onClick={onOpenSearch}
            className="group flex items-center justify-center lg:justify-between w-full py-2 text-white/70 hover:text-white transition-colors duration-200 focus:outline-none cursor-pointer"
            aria-label="Search movies, actors, genres, languages"
          >
            <span className="hidden lg:inline text-[15px] font-medium tracking-[0.06em]">
              Search
            </span>
            <Search className="h-5 w-5 stroke-[1.6] text-white/85 group-hover:text-white group-hover:scale-110 transition-all duration-200" />
          </button>
        </div>

        {/* Center vertically balanced navigation links — matching main gallery hover physics */}
        <nav
          aria-label="Main navigation"
          onMouseLeave={() => setHoveredId(null)}
          className="flex flex-col gap-1 my-auto"
        >
          {NAV_ITEMS.map((item, index) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            const isHovered = hoveredId === item.id;
            const isNeighborDimmed = hasAnyHover && !isHovered;

            // Mirroring VerticalPosterGallery neighbor distance & accordion prominence
            const distance =
              hoveredIndex === -1 ? 0 : Math.abs(index - hoveredIndex);
            const direction =
              hoveredIndex === -1 ? 0 : index < hoveredIndex ? -1 : 1;

            const itemScale = isHovered
              ? 1.07
              : distance === 1
              ? 0.965
              : hasAnyHover
              ? 0.935
              : 1;

            const itemOpacity = isHovered
              ? 1
              : isNeighborDimmed
              ? distance === 1
                ? 0.45
                : 0.3
              : isActive
              ? 1
              : 0.56;

            const itemShiftY = isHovered
              ? 0
              : hasAnyHover
              ? direction * (distance === 1 ? 3 : 5)
              : 0;

            const itemShiftX = isHovered ? 6 : 0;

            const badgeCount =
              item.id === 'my-bookings'
                ? bookingsCount
                : item.id === 'my-list'
                ? myListCount
                : 0;

            return (
              <motion.button
                key={item.id}
                type="button"
                onClick={() => onSelectSection(item.id)}
                onMouseEnter={() => setHoveredId(item.id)}
                onFocus={() => setHoveredId(item.id)}
                onBlur={() => setHoveredId(null)}
                title={item.label}
                initial={{ opacity: 0, x: -16 }}
                animate={{
                  opacity: itemOpacity,
                  scale: itemScale,
                  x: itemShiftX,
                  y: itemShiftY,
                  paddingTop: isHovered ? 13 : hasAnyHover ? 7 : 10,
                  paddingBottom: isHovered ? 13 : hasAnyHover ? 7 : 10,
                }}
                transition={{
                  duration: 0.48,
                  ease: [0.22, 1, 0.36, 1],
                  opacity: { duration: 0.35 },
                }}
                style={{ transformOrigin: 'left center' }}
                className={`group relative flex items-center justify-center lg:justify-start gap-3 px-2 lg:px-0 text-left cursor-pointer focus:outline-none ${
                  isHovered || isActive ? 'text-white' : 'text-white/80'
                }`}
              >
                {/* Subtle atmospheric hover aura behind active/hovered link */}
                <motion.span
                  aria-hidden="true"
                  animate={{
                    opacity: isHovered ? 1 : 0,
                    scaleX: isHovered ? 1 : 0.75,
                  }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="pointer-events-none absolute -inset-x-2 inset-y-0.5 -z-10 rounded-[3px] bg-gradient-to-r from-[#e50914]/15 via-white/[0.04] to-transparent"
                />

                {/* Active background glide */}
                {isActive && (
                  <motion.span
                    layoutId="sidebar-active-bg"
                    transition={{ type: 'spring', stiffness: 260, damping: 28 }}
                    className="pointer-events-none absolute -inset-x-2 inset-y-0.5 -z-10 rounded-[3px] bg-gradient-to-r from-white/[0.08] via-white/[0.03] to-transparent"
                  />
                )}

                {/* Active vertical indicator bar */}
                {isActive && (
                  <motion.span
                    layoutId="sidebar-active-indicator"
                    transition={{ type: 'spring', stiffness: 260, damping: 28 }}
                    className="absolute -left-4 lg:-left-7 top-1/2 -translate-y-1/2 h-4 w-[2px] rounded-full bg-[#e50914] shadow-[0_0_12px_#e50914]"
                  />
                )}

                <Icon
                  className={`h-4 w-4 shrink-0 stroke-[1.6] transition-transform duration-300 ${
                    isHovered ? 'scale-110 text-[#e50914]' : isActive ? 'text-[#e50914]' : 'text-current'
                  }`}
                />

                <span
                  className={`hidden lg:inline whitespace-nowrap text-[13px] font-semibold transition-all duration-300 ${
                    isHovered ? 'tracking-[0.18em]' : 'tracking-[0.15em]'
                  }`}
                >
                  {item.label}
                </span>

                {badgeCount > 0 && (
                  <span className="hidden lg:inline-flex ml-auto items-center justify-center rounded-full bg-white/10 px-2 py-0.5 text-[10.5px] font-medium text-white/85">
                    {badgeCount}
                  </span>
                )}
              </motion.button>
            );
          })}
        </nav>

        {/* Subtle AI Discovery status footer */}
        <div className="hidden lg:flex flex-col gap-1 text-[11px] text-white/30 tracking-wider">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/75" />
            <span>AI CURATION LIVE</span>
          </div>
          <span>3 THEATRES NEARBY</span>
        </div>
      </aside>

      {/* Mobile Compact Bottom Navigation */}
      <nav
        aria-label="Mobile navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t border-white/[0.07] bg-[#0b0b0f]/90 backdrop-blur-xl px-2 py-2.5"
      >
        {NAV_ITEMS.filter((item) =>
          ['home', 'now-showing', 'categories', 'my-bookings', 'my-list'].includes(
            item.id
          )
        ).map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectSection(item.id)}
              className={`flex flex-col items-center gap-1 px-2 py-1 text-[10.5px] tracking-[0.1em] transition-colors ${
                isActive ? 'text-white' : 'text-white/45'
              }`}
            >
              <Icon
                className={`h-4 w-4 stroke-[1.6] ${
                  isActive ? 'text-[#e50914]' : 'text-current'
                }`}
              />
              <span className="uppercase">{item.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
