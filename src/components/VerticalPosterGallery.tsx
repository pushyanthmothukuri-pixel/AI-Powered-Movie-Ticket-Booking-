import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Film, Star, Ticket } from 'lucide-react';
import { CategoryItem, Movie } from '../types/cinema';

export interface GallerySliceItem {
  id: string;
  kind: 'category' | 'movie';
  title: string;
  subtitle?: string;
  poster: string;
  staggerY: number;
  ambientColor: string;
  rating?: number;
  status?: 'now-showing' | 'coming-soon';
  language?: string;
  duration?: string;
  categoryRef?: CategoryItem;
  movieRef?: Movie;
}

interface VerticalPosterGalleryProps {
  items: GallerySliceItem[];
  heading?: string;
  subheading?: string;
  canGoBack?: boolean;
  onGoBack?: () => void;
  onHoverItem: (item: GallerySliceItem | null) => void;
  onSelectItem: (item: GallerySliceItem) => void;
  headerSlot?: React.ReactNode;
}

export const VerticalPosterGallery: React.FC<VerticalPosterGalleryProps> = ({
  items,
  heading,
  subheading,
  canGoBack,
  onGoBack,
  onHoverItem,
  onSelectItem,
  headerSlot,
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const handleMouseEnter = (item: GallerySliceItem) => {
    setHoveredId(item.id);
    onHoverItem(item);
  };

  const handleMouseLeave = () => {
    setHoveredId(null);
    onHoverItem(null);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
      className="relative z-10 flex h-full w-full flex-col justify-center px-4 pt-[94px] pb-[78px] md:pb-8 md:pl-[108px] md:pr-8 lg:pl-[264px] lg:pr-[60px] xl:pr-[210px]"
    >
      {headerSlot}

      {/* Subtle context breadcrumb when drilling into a category or filtered view */}
      {(heading || canGoBack) && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-4 flex items-center justify-between px-1"
        >
          <div className="flex items-center gap-3">
            {canGoBack && onGoBack && (
              <button
                onClick={onGoBack}
                className="group flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-medium tracking-wider text-white/75 hover:border-white/25 hover:text-white transition-all cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
                <span>ALL GENRES</span>
              </button>
            )}
            {heading && (
              <div>
                <h2 className="text-base sm:text-xl font-semibold uppercase tracking-[0.2em] text-white">
                  {heading}
                </h2>
                {subheading && (
                  <p className="mt-0.5 text-[14px] text-white/55">
                    {subheading}
                  </p>
                )}
              </div>
            )}
          </div>
          <span className="hidden sm:inline text-[13px] uppercase tracking-[0.18em] text-white/45">
            {items.length} {items.length === 1 ? 'Feature' : 'Selections'}
          </span>
        </motion.div>
      )}

      {/* Desktop & Tablet Horizontal Staggered Vertical-Slice Stage */}
      <div
        onMouseLeave={handleMouseLeave}
        className={`hidden md:flex w-full items-center justify-center gap-2 lg:gap-2.5 ${
          headerSlot ? 'h-[56vh] max-h-[540px]' : 'h-[66vh] max-h-[640px]'
        }`}
      >
        {items.map((item, index) => {
          const isHovered = hoveredId === item.id;
          const hasAnyHover = hoveredId !== null;
          const isNeighborDimmed = hasAnyHover && !isHovered;

          // Neighbor distance calculation for smooth shifting/scaling feel
          const hoveredIndex = items.findIndex((i) => i.id === hoveredId);
          const distance =
            hoveredIndex === -1 ? 0 : Math.abs(index - hoveredIndex);
          const neighborScale =
            isHovered ? 1.03 : distance === 1 ? 0.985 : hasAnyHover ? 0.965 : 1;

          // Height rhythm matching reference's tall vertical strips
          const baseHeightPct =
            index % 3 === 0 ? 86 : index % 2 === 0 ? 92 : 84;

          return (
            <motion.button
              key={item.id}
              type="button"
              onClick={() => onSelectItem(item)}
              onMouseEnter={() => handleMouseEnter(item)}
              onFocus={() => handleMouseEnter(item)}
              onBlur={handleMouseLeave}
              initial={{ opacity: 0, y: item.staggerY + 28 }}
              animate={{
                opacity: isNeighborDimmed ? 0.56 : 1,
                y: isHovered ? Math.round(item.staggerY * 0.35) : item.staggerY,
                flexGrow: isHovered ? 2.55 : hasAnyHover ? 0.84 : 1,
                scale: neighborScale,
              }}
              transition={{
                duration: 0.48,
                ease: [0.22, 1, 0.36, 1],
                opacity: { duration: 0.35 },
              }}
              style={{
                height: `${baseHeightPct}%`,
                flexBasis: 0,
              }}
              className={`group relative min-w-[54px] overflow-hidden rounded-[3px] bg-[#14141a] text-left cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-white/60 ${
                isHovered
                  ? 'z-20 shadow-[0_28px_70px_rgba(0,0,0,0.85)] ring-1 ring-white/20'
                  : 'z-10 shadow-[0_14px_35px_rgba(0,0,0,0.55)]'
              }`}
              aria-label={`${item.title}${item.subtitle ? ` — ${item.subtitle}` : ''}`}
            >
              {/* Poster Artwork */}
              <img
                src={item.poster}
                alt={item.title}
                loading="eager"
                className={`h-full w-full object-cover object-center transition-all duration-700 ease-out ${
                  isHovered
                    ? 'scale-[1.06] brightness-105 contrast-[1.03]'
                    : isNeighborDimmed
                    ? 'scale-100 brightness-[0.72] saturate-[0.82]'
                    : 'scale-[1.02] brightness-[0.88]'
                }`}
              />

              {/* Subtle top and bottom dark cinema gradients */}
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    'linear-gradient(180deg, rgba(8,8,12,0.42) 0%, rgba(8,8,12,0.12) 32%, rgba(8,8,12,0.52) 55%, rgba(8,8,12,0.85) 100%)',
                }}
              />

              {/* Subtle center radial scrim behind label (matches reference readability) */}
              <div
                className={`pointer-events-none absolute inset-0 transition-opacity duration-500 ${
                  isHovered ? 'opacity-65' : 'opacity-85'
                }`}
                style={{
                  background:
                    'radial-gradient(circle at 50% 50%, rgba(6,6,10,0.62) 0%, transparent 68%)',
                }}
              />

              {/* Status badge for individual movies */}
              {item.kind === 'movie' && item.status && (
                <div
                  className={`absolute top-3 left-3 transition-opacity duration-300 ${
                    isHovered ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <span
                    className={`inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] backdrop-blur-md ${
                      item.status === 'now-showing'
                        ? 'bg-[#e50914]/85 text-white'
                        : 'bg-white/15 text-white/90'
                    }`}
                  >
                    {item.status === 'now-showing' ? 'Now Showing' : 'Coming Soon'}
                  </span>
                </div>
              )}

              {/* Center Poster Title / Category Label — mirroring the reference */}
              <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 flex flex-col items-center text-center pointer-events-none">
                <h3
                  className={`font-semibold tracking-[0.04em] text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)] transition-all duration-300 leading-snug ${
                    isHovered
                      ? 'text-[20px] lg:text-[25px] scale-105'
                      : 'text-[15px] lg:text-[18px]'
                  }`}
                >
                  {item.title}
                </h3>

                {/* Subtle secondary reveal on hover */}
                <div
                  className={`mt-2.5 flex flex-col items-center gap-1.5 overflow-hidden transition-all duration-300 ${
                    isHovered
                      ? 'max-h-32 opacity-100 translate-y-0'
                      : 'max-h-0 opacity-0 translate-y-2'
                  }`}
                >
                  {item.subtitle && (
                    <span className="text-[12.5px] uppercase tracking-[0.15em] text-white/85">
                      {item.subtitle}
                    </span>
                  )}

                  {item.kind === 'movie' && item.rating && (
                    <div className="flex items-center gap-3 text-[13px] text-white/90">
                      <span className="inline-flex items-center gap-1 text-[#d4a853]">
                        <Star className="h-3.5 w-3.5 fill-[#d4a853]" />
                        {item.rating.toFixed(1)}
                      </span>
                      {item.duration && <span>{item.duration}</span>}
                      {item.language && <span>{item.language}</span>}
                    </div>
                  )}

                  <span className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-black/55 px-4 py-1.5 text-[12px] font-semibold uppercase tracking-[0.15em] text-white backdrop-blur-md">
                    {item.kind === 'category' ? (
                      <>
                        <Film className="h-3.5 w-3.5 text-[#e50914]" />
                        Explore Genre
                      </>
                    ) : (
                      <>
                        <Ticket className="h-3.5 w-3.5 text-[#e50914]" />
                        View &amp; Book
                      </>
                    )}
                  </span>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Mobile Horizontally Scrollable Tall Portrait Carousel */}
      <div className="md:hidden flex w-full items-center gap-3.5 overflow-x-auto snap-x snap-mandatory no-scrollbar py-2">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectItem(item)}
            className="relative h-[58vh] w-[62vw] max-w-[260px] shrink-0 snap-center overflow-hidden rounded-md bg-[#14141a] text-left shadow-[0_18px_45px_rgba(0,0,0,0.7)] ring-1 ring-white/10 active:scale-[0.98] transition-transform"
          >
            <img
              src={item.poster}
              alt={item.title}
              className="h-full w-full object-cover brightness-90"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(180deg, rgba(9,9,12,0.25) 0%, rgba(9,9,12,0.5) 55%, rgba(9,9,12,0.92) 100%)',
              }}
            />
            <div className="absolute inset-x-4 bottom-5 flex flex-col gap-1.5">
              {item.subtitle && (
                <span className="text-[10px] uppercase tracking-[0.18em] text-white/65">
                  {item.subtitle}
                </span>
              )}
              <h3 className="text-lg font-semibold tracking-wide text-white">
                {item.title}
              </h3>
              <span className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-full bg-[#e50914]/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
                {item.kind === 'category' ? 'Explore' : 'Book Tickets'}
              </span>
            </div>
          </button>
        ))}
      </div>
    </motion.section>
  );
};
