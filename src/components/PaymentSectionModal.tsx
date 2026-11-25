import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import QRCode from 'qrcode';
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  QrCode,
  ShieldCheck,
  Smartphone,
  Sparkles,
  X,
} from 'lucide-react';
import { Movie } from '../types/cinema';

type PaymentAppOption = 'universal' | 'gpay' | 'phonepe' | 'paytm';

interface PaymentSectionModalProps {
  isOpen: boolean;
  movie: Movie;
  theatreName: string;
  location: string;
  dateLabel: string;
  time: string;
  format: string;
  seats: string[];
  totalAmount: number;
  onClose: () => void;
  onPaymentSuccess: () => void;
}

const PAYMENT_APPS: {
  id: PaymentAppOption;
  label: string;
  schemePrefix: string;
  hint: string;
}[] = [
  {
    id: 'universal',
    label: 'Any UPI App',
    schemePrefix: 'upi://pay',
    hint: 'Scan with Phone Camera, GPay, PhonePe, Paytm, or BHIM',
  },
  {
    id: 'gpay',
    label: 'Google Pay',
    schemePrefix: 'tez://upi/pay',
    hint: 'Opens directly in Google Pay on supported devices',
  },
  {
    id: 'phonepe',
    label: 'PhonePe',
    schemePrefix: 'phonepe://pay',
    hint: 'Opens directly in PhonePe on supported devices',
  },
  {
    id: 'paytm',
    label: 'Paytm',
    schemePrefix: 'paytmmp://pay',
    hint: 'Opens directly in Paytm on supported devices',
  },
];

export const PaymentSectionModal: React.FC<PaymentSectionModalProps> = ({
  isOpen,
  movie,
  theatreName,
  location,
  dateLabel,
  time,
  format,
  seats,
  totalAmount,
  onClose,
  onPaymentSuccess,
}) => {
  const [selectedApp, setSelectedApp] = useState<PaymentAppOption>('universal');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [processing, setProcessing] = useState(false);

  const txnRef = useMemo(() => {
    const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `CGPAY${rand}`;
  }, [isOpen]);

  // Standard UPI payment URI recognized by phone cameras and all major payment apps
  const queryParams = useMemo(() => {
    const params = new URLSearchParams({
      pa: 'cinego.cinema@okaxis',
      pn: 'CINE GO Cinema',
      tr: txnRef,
      tn: `${movie.title} Seats ${seats.join(',')}`,
      am: totalAmount.toFixed(2),
      cu: 'INR',
    });
    return params.toString();
  }, [txnRef, movie.title, seats, totalAmount]);

  // Universal upi://pay QR ensures any phone camera or scanner opens the payment app chooser
  const qrPaymentUri = `upi://pay?${queryParams}`;

  const activeAppConfig =
    PAYMENT_APPS.find((a) => a.id === selectedApp) ?? PAYMENT_APPS[0];
  const directAppUri = `${activeAppConfig.schemePrefix}?${queryParams}`;

  useEffect(() => {
    if (!isOpen) return;
    let mounted = true;
    QRCode.toDataURL(qrPaymentUri, {
      width: 400,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#09090c',
        light: '#f7f7fa',
      },
    })
      .then((url) => {
        if (mounted) setQrDataUrl(url);
      })
      .catch(() => {
        if (mounted) setQrDataUrl('');
      });

    return () => {
      mounted = false;
    };
  }, [isOpen, qrPaymentUri]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !processing) {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, processing, onClose]);

  const handleConfirmPayment = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      onPaymentSuccess();
    }, 650);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={() => !processing && onClose()}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-xl"
          role="dialog"
          aria-modal="true"
          aria-label="Ticket Payment"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-white/15 bg-[#0e0e14] shadow-[0_32px_90px_rgba(0,0,0,0.94)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4 sm:px-7">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={processing}
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/12 bg-white/[0.04] text-white/75 hover:border-white/30 hover:text-white transition-colors cursor-pointer"
                  aria-label="Back to seat selection"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#e50914]">
                    Secure Checkout · Scan to Pay
                  </p>
                  <h2 className="text-lg sm:text-xl font-semibold text-white">
                    Complete Ticket Payment
                  </h2>
                </div>
              </div>

              <button
                type="button"
                disabled={processing}
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/12 text-white/60 hover:border-white/30 hover:text-white transition-colors cursor-pointer"
                aria-label="Close payment"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="grid grid-cols-1 gap-6 p-5 sm:p-7 md:grid-cols-12">
              {/* Left: Scannable Payment QR & App Selector */}
              <div className="md:col-span-7 flex flex-col items-center rounded-xl border border-white/10 bg-[#13131b]/80 p-5 text-center">
                {/* Payment App Picker */}
                <div className="flex flex-wrap justify-center gap-1.5">
                  {PAYMENT_APPS.map((app) => {
                    const active = app.id === selectedApp;
                    return (
                      <button
                        key={app.id}
                        type="button"
                        onClick={() => setSelectedApp(app.id)}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition-all cursor-pointer ${
                          active
                            ? 'bg-[#e50914] text-white shadow-[0_0_14px_rgba(229,9,20,0.45)]'
                            : 'border border-white/12 bg-white/[0.03] text-white/70 hover:border-white/25 hover:text-white'
                        }`}
                      >
                        {app.label}
                      </button>
                    );
                  })}
                </div>

                {/* Scannable Payment QR Code */}
                <div className="relative mt-4 rounded-xl border border-white/15 bg-[#f7f7fa] p-3 shadow-[0_14px_40px_rgba(0,0,0,0.6)]">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt="UPI Payment QR Code"
                      className="h-[190px] w-[190px] rounded-md"
                    />
                  ) : (
                    <div className="flex h-[190px] w-[190px] items-center justify-center text-black/40">
                      <QrCode className="h-10 w-10" />
                    </div>
                  )}

                  {/* Animated scanner line */}
                  <motion.div
                    aria-hidden="true"
                    animate={{ top: ['10%', '86%', '10%'] }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    className="pointer-events-none absolute left-3 right-3 h-[2px] bg-[#e50914]/70 shadow-[0_0_10px_rgba(229,9,20,0.8)]"
                  />
                </div>

                <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-white/85">
                  <Smartphone className="h-3.5 w-3.5 text-[#d4a853]" />
                  <span>{activeAppConfig.hint}</span>
                </p>

                <p className="mt-1 font-mono text-[11px] text-white/45">
                  UPI ID: cinego.cinema@okaxis · Ref: {txnRef}
                </p>

                {/* Direct Tap Deep Link for mobile browsers */}
                <a
                  href={directAppUri}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[#d4a853]/40 bg-[#d4a853]/12 px-4 py-1.5 text-xs font-medium text-[#e9c478] hover:bg-[#d4a853]/20 transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Open {activeAppConfig.label} App</span>
                </a>
              </div>

              {/* Right: Order Breakdown & Payment Confirmation */}
              <div className="md:col-span-5 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={movie.poster}
                      alt={movie.title}
                      className="h-20 w-14 rounded-[4px] object-cover ring-1 ring-white/15 shrink-0"
                    />
                    <div className="min-w-0">
                      <span className="inline-block rounded-sm bg-[#e50914]/20 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.15em] text-[#ff5c65]">
                        {format}
                      </span>
                      <h3 className="mt-1 truncate text-base font-semibold text-white">
                        {movie.title}
                      </h3>
                      <p className="truncate text-xs text-white/55">
                        {theatreName}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 rounded-xl border border-white/[0.08] bg-white/[0.02] p-3.5 text-[13px]">
                    <div className="flex justify-between gap-2">
                      <span className="text-white/50">Location</span>
                      <span className="text-right text-white/85">{location}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-white/50">Showtime</span>
                      <span className="text-right text-white/85">
                        {dateLabel} · {time}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-white/50">Seats ({seats.length})</span>
                      <span className="text-right font-semibold text-[#d4a853]">
                        {[...seats].sort().join(', ')}
                      </span>
                    </div>
                    <div className="my-1 h-px bg-white/[0.08]" />
                    <div className="flex items-center justify-between pt-0.5">
                      <span className="text-white/65">Payable Total</span>
                      <span className="text-xl font-semibold text-[#d4a853]">
                        ${totalAmount}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300/90">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                      Scanning the QR opens your payment app with exact ticket
                      amount &amp; seat reference pre-filled.
                    </span>
                  </div>
                </div>

                <div className="mt-5 space-y-2.5">
                  <button
                    type="button"
                    disabled={processing}
                    onClick={handleConfirmPayment}
                    className="flex w-full items-center justify-center gap-2 rounded-[4px] bg-[#e50914] py-3 text-[13px] font-semibold uppercase tracking-[0.16em] text-white shadow-[0_10px_28px_rgba(229,9,20,0.45)] hover:bg-[#f6121d] disabled:opacity-60 transition-all cursor-pointer"
                  >
                    {processing ? (
                      <>
                        <Sparkles className="h-4 w-4 animate-pulse" />
                        <span>Verifying Payment...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        <span>I&rsquo;ve Paid · Issue Ticket</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
