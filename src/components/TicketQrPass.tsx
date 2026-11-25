import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import QRCode from 'qrcode';
import {
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  QrCode,
  ScanLine,
  Ticket,
  X,
} from 'lucide-react';
import { BookingRecord } from '../types/cinema';

/** Build human-readable ticket payload encoded into the QR so any scanner shows full ticket details. */
export function buildTicketQrPayload(booking: BookingRecord): string {
  return [
    'CINE GO E-TICKET',
    `PASS: ${booking.ticketCode}`,
    `MOVIE: ${booking.movieTitle}`,
    `THEATRE: ${booking.theatreName} (${booking.location})`,
    `DATE: ${booking.dateLabel}`,
    `SHOWTIME: ${booking.time}`,
    `FORMAT: ${booking.format}`,
    `SEATS: ${booking.seats.join(', ')}`,
    `TOTAL: $${booking.totalAmount}`,
    'STATUS: CONFIRMED',
  ].join('\n');
}

interface QrCodeImageProps {
  booking: BookingRecord;
  size?: number;
}

export const QrCodeImage: React.FC<QrCodeImageProps> = ({
  booking,
  size = 180,
}) => {
  const [dataUrl, setDataUrl] = useState<string>('');
  const payload = useMemo(() => buildTicketQrPayload(booking), [booking]);

  useEffect(() => {
    let mounted = true;
    QRCode.toDataURL(payload, {
      width: size * 2,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#09090c',
        light: '#f7f7fa',
      },
    })
      .then((url) => {
        if (mounted) setDataUrl(url);
      })
      .catch(() => {
        if (mounted) setDataUrl('');
      });

    return () => {
      mounted = false;
    };
  }, [payload, size]);

  if (!dataUrl) {
    return (
      <div
        style={{ width: size, height: size }}
        className="flex items-center justify-center rounded-lg bg-[#f7f7fa] text-[#09090c]"
      >
        <QrCode className="h-8 w-8 opacity-40" />
      </div>
    );
  }

  return (
    <img
      src={dataUrl}
      alt={`QR Ticket Pass for ${booking.movieTitle} (${booking.ticketCode})`}
      style={{ width: size, height: size }}
      className="rounded-lg shadow-inner"
    />
  );
};

interface TicketQrModalProps {
  booking: BookingRecord | null;
  onClose: () => void;
}

export const TicketQrModal: React.FC<TicketQrModalProps> = ({
  booking,
  onClose,
}) => {
  const [scanPreviewOpen, setScanPreviewOpen] = useState(false);

  useEffect(() => {
    setScanPreviewOpen(false);
  }, [booking?.id]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && booking) {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [booking, onClose]);

  const qrPayload = useMemo(
    () => (booking ? buildTicketQrPayload(booking) : ''),
    [booking]
  );

  return (
    <AnimatePresence>
      {booking && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-xl"
          role="dialog"
          aria-modal="true"
          aria-label={`Ticket QR Pass for ${booking.movieTitle}`}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/15 bg-[#0f0f15] shadow-[0_32px_90px_rgba(0,0,0,0.92)]"
          >
            {/* Top Ticket Header Strip */}
            <div className="relative flex items-center gap-4 border-b border-dashed border-white/15 bg-[#14141d] p-5">
              <img
                src={booking.poster}
                alt={booking.movieTitle}
                className="h-24 w-16 rounded-[4px] object-cover ring-1 ring-white/15 shrink-0"
              />
              <div className="min-w-0 flex-1 pr-7">
                <div className="flex items-center gap-2">
                  <span className="rounded-sm bg-[#e50914] px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.18em] text-white">
                    {booking.format}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" />
                    Confirmed
                  </span>
                </div>
                <h2 className="mt-1.5 truncate font-display text-2xl tracking-[0.06em] text-white">
                  {booking.movieTitle}
                </h2>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-white/60 truncate">
                  <MapPin className="h-3 w-3 shrink-0 text-[#e50914]" />
                  <span>
                    {booking.theatreName} · {booking.location}
                  </span>
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="absolute top-3.5 right-3.5 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white/65 hover:border-white/30 hover:text-white transition-colors cursor-pointer"
                aria-label="Close ticket pass"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Ticket Details Grid */}
            <div className="grid grid-cols-3 gap-3 border-b border-dashed border-white/15 px-5 py-4 text-sm">
              <div>
                <span className="flex items-center gap-1 text-[11px] uppercase tracking-[0.16em] text-white/45">
                  <Calendar className="h-3.5 w-3.5" />
                  Date
                </span>
                <p className="mt-1 font-medium text-white">
                  {booking.dateLabel}
                </p>
              </div>

              <div>
                <span className="flex items-center gap-1 text-[11px] uppercase tracking-[0.16em] text-white/45">
                  <Clock className="h-3.5 w-3.5" />
                  Showtime
                </span>
                <p className="mt-1 font-medium text-white">{booking.time}</p>
              </div>

              <div>
                <span className="flex items-center gap-1 text-[11px] uppercase tracking-[0.16em] text-white/45">
                  <Ticket className="h-3.5 w-3.5" />
                  Seats
                </span>
                <p className="mt-1 font-semibold text-[#d4a853]">
                  {booking.seats.join(', ')}
                </p>
              </div>
            </div>

            {/* Scannable QR Code Stage */}
            <div className="flex flex-col items-center px-5 pt-5 pb-6 text-center">
              <div className="relative rounded-xl border border-white/15 bg-[#f7f7fa] p-3 shadow-[0_14px_40px_rgba(0,0,0,0.55)]">
                <QrCodeImage booking={booking} size={172} />

                {/* Subtle animated scanner line */}
                <motion.div
                  aria-hidden="true"
                  animate={{ top: ['12%', '84%', '12%'] }}
                  transition={{
                    duration: 3.2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="pointer-events-none absolute left-3 right-3 h-[2px] bg-[#e50914]/65 shadow-[0_0_10px_rgba(229,9,20,0.8)]"
                />
              </div>

              <div className="mt-3 flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-[0.2em] text-white/40">
                  Pass ID:
                </span>
                <span className="font-mono text-xs font-semibold tracking-[0.16em] text-white">
                  {booking.ticketCode}
                </span>
                <span className="text-xs text-[#d4a853] font-medium">
                  · ${booking.totalAmount}
                </span>
              </div>

              <p className="mt-1.5 text-[11px] text-white/50">
                Scan this QR at the cinema gate or with any camera to view your
                booking details.
              </p>

              {/* Toggle to preview decoded QR scanner output directly */}
              <button
                type="button"
                onClick={() => setScanPreviewOpen((prev) => !prev)}
                className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.04] px-3 py-1 text-[10.5px] font-medium text-white/75 hover:border-white/25 hover:text-white transition-colors cursor-pointer"
              >
                <ScanLine className="h-3.5 w-3.5 text-[#d4a853]" />
                <span>
                  {scanPreviewOpen
                    ? 'Hide Scanned Output'
                    : 'Preview Scanned Ticket Data'}
                </span>
              </button>

              <AnimatePresence>
                {scanPreviewOpen && (
                  <motion.pre
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    className="w-full overflow-hidden rounded-lg border border-white/10 bg-[#09090d] p-3 text-left font-mono text-[10.5px] leading-relaxed text-emerald-300/90 whitespace-pre-wrap"
                  >
                    {qrPayload}
                  </motion.pre>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
