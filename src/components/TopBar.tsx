import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronDown,
  LogIn,
  LogOut,
  Search,
  Settings,
  Sparkles,
  Ticket,
  User,
} from 'lucide-react';
import { NavSection } from '../types/cinema';

interface TopBarProps {
  onGoHome: () => void;
  onOpenSearch: () => void;
  onSelectSection: (section: NavSection) => void;
  onOpenAccountSettings: () => void;
  userName: string;
  isSignedIn: boolean;
  onToggleSignIn: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onGoHome,
  onOpenSearch,
  onSelectSection,
  onOpenAccountSettings,
  userName,
  isSignedIn,
  onToggleSignIn,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-30 flex h-[84px] items-center justify-between px-5 md:pl-[100px] lg:pl-[248px] lg:pr-8 pointer-events-none">
      {/* Mobile Left Search Button */}
      <div className="flex md:hidden items-center pointer-events-auto">
        <button
          onClick={onOpenSearch}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/80 hover:text-white transition-colors"
          aria-label="Open search"
        >
          <Search className="h-4 w-4 stroke-[1.6]" />
        </button>
      </div>

      {/* Centered Brand Wordmark — prominent focal anchor */}
      <div className="pointer-events-auto md:absolute md:left-1/2 md:-translate-x-1/2">
        <button
          onClick={onGoHome}
          className="group flex items-center gap-2 focus:outline-none cursor-pointer"
          aria-label="CINE GO Home"
        >
          <span className="font-display text-[46px] sm:text-[58px] lg:text-[68px] leading-none tracking-[0.16em] text-[#e50914] drop-shadow-[0_0_26px_rgba(229,9,20,0.45)] transition-all duration-300 group-hover:tracking-[0.2em] group-hover:brightness-110">
            CINE GO
          </span>
        </button>
      </div>

      {/* Right User Profile Area */}
      <div
        ref={dropdownRef}
        className="relative ml-auto pointer-events-auto"
      >
        <button
          onClick={() => setDropdownOpen((prev) => !prev)}
          className="group flex items-center gap-2.5 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-white/[0.05] cursor-pointer focus:outline-none"
          aria-expanded={dropdownOpen}
          aria-haspopup="menu"
        >
          <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-gradient-to-br from-zinc-700 via-zinc-800 to-black shadow-inner">
            {isSignedIn ? (
              <span className="text-xs font-semibold tracking-wider text-white/90">
                {userName
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </span>
            ) : (
              <User className="h-4 w-4 text-white/60" />
            )}
            <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full border border-[#0b0b0f] bg-emerald-400" />
          </div>

          <span className="hidden sm:inline text-[15px] font-normal tracking-[0.02em] text-white/85 group-hover:text-white transition-colors">
            {isSignedIn ? userName : 'Guest Pass'}
          </span>

          <ChevronDown
            className={`h-3.5 w-3.5 text-white/45 transition-transform duration-200 ${
              dropdownOpen ? 'rotate-180 text-white/80' : ''
            }`}
          />
        </button>

        <AnimatePresence>
          {dropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.96 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="absolute right-0 mt-2.5 w-56 overflow-hidden rounded-xl border border-white/10 bg-[#121218]/95 p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.75)] backdrop-blur-2xl"
              role="menu"
            >
              <div className="border-b border-white/[0.07] px-3 py-2.5">
                <p className="text-sm font-medium text-white">
                  {isSignedIn ? userName : 'Guest Viewer'}
                </p>
                <p className="mt-0.5 flex items-center gap-1 text-[11.5px] text-white/50">
                  <Sparkles className="h-3 w-3 text-[#d4a853]" />
                  <span>
                    {isSignedIn ? 'CINE GO Noir Member' : 'Sign in for AI picks'}
                  </span>
                </p>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onSelectSection('my-bookings');
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13.5px] text-white/80 hover:bg-white/[0.06] hover:text-white transition-colors cursor-pointer"
                  role="menuitem"
                >
                  <Ticket className="h-4 w-4 text-white/55" />
                  <span>My Bookings</span>
                </button>

                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onOpenAccountSettings();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13.5px] text-white/80 hover:bg-white/[0.06] hover:text-white transition-colors cursor-pointer"
                  role="menuitem"
                >
                  <Settings className="h-4 w-4 text-white/55" />
                  <span>Account Settings</span>
                </button>
              </div>

              <div className="border-t border-white/[0.07] pt-1">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onToggleSignIn();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13.5px] text-white/80 hover:bg-[#e50914]/15 hover:text-[#ff5d65] transition-colors cursor-pointer"
                  role="menuitem"
                >
                  {isSignedIn ? (
                    <>
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Logout</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="h-3.5 w-3.5" />
                      <span>Sign In</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};
