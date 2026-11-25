import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface AmbientBackdropProps {
  imageSrc: string;
  ambientTint: string;
}

export const AmbientBackdrop: React.FC<AmbientBackdropProps> = ({
  imageSrc,
  ambientTint,
}) => {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#09090c]">
      {/* Crossfading blurred cinematic backdrop */}
      <AnimatePresence mode="sync">
        <motion.div
          key={imageSrc}
          initial={{ opacity: 0, scale: 1.06 }}
          animate={{ opacity: 0.34, scale: 1.02 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 bg-cover bg-center blur-2xl saturate-75"
          style={{ backgroundImage: `url(${imageSrc})` }}
        />
      </AnimatePresence>

      {/* Atmospheric colored glow reacting to hovered poster */}
      <motion.div
        className="absolute inset-0 transition-colors duration-700"
        animate={{
          background: `radial-gradient(ellipse 65% 55% at 54% 48%, ${ambientTint}, transparent 72%)`,
        }}
        transition={{ duration: 0.7 }}
      />

      {/* Strong charcoal vignette & top/bottom depth overlays */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(9,9,12,0.88) 0%, rgba(11,11,15,0.62) 45%, rgba(8,8,11,0.92) 100%)',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(90deg, rgba(9,9,12,0.92) 0%, rgba(9,9,12,0.45) 22%, rgba(9,9,12,0.38) 80%, rgba(9,9,12,0.88) 100%)',
        }}
      />

      {/* Subtle cinema grain */}
      <div className="cine-grain absolute inset-0 opacity-60" />

      {/* Architectural vertical hairlines matching the reference composition */}
      <div className="hidden lg:block absolute inset-y-0 left-[242px] w-px bg-white/[0.06]" />
      <div className="hidden xl:block absolute inset-y-0 right-[210px] w-px bg-white/[0.055]" />
      <div className="hidden lg:block absolute inset-y-0 left-1/2 w-px bg-white/[0.025]" />
    </div>
  );
};
