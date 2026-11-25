import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle2,
  KeyRound,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import { AmbientBackdrop } from './AmbientBackdrop';

interface OtpLoginViewProps {
  onSuccess: (phoneDisplay: string) => void;
}

const COUNTRY_CODES = [
  { code: '+91', label: 'IN +91' },
  { code: '+1', label: 'US +1' },
  { code: '+44', label: 'UK +44' },
  { code: '+971', label: 'AE +971' },
];

function createSixDigitOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export const OtpLoginView: React.FC<OtpLoginViewProps> = ({ onSuccess }) => {
  const [step, setStep] = useState<'phone' | 'otp' | 'verified'>('phone');
  const [countryCode, setCountryCode] = useState('+91');
  const [phone, setPhone] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>([
    '',
    '',
    '',
    '',
    '',
    '',
  ]);
  const [error, setError] = useState('');
  const [resendSeconds, setResendSeconds] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = setInterval(() => {
      setResendSeconds((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendSeconds]);

  const cleanDigits = phone.replace(/\D/g, '');

  const handleSendOtp = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (cleanDigits.length < 8) {
      setError('Please enter a valid mobile number (at least 8 digits).');
      return;
    }
    const code = createSixDigitOtp();
    setGeneratedOtp(code);
    setOtpDigits(['', '', '', '', '', '']);
    setError('');
    setResendSeconds(30);
    setStep('otp');
    setTimeout(() => inputRefs.current[0]?.focus(), 140);
  };

  const handleResend = () => {
    if (resendSeconds > 0) return;
    const code = createSixDigitOtp();
    setGeneratedOtp(code);
    setOtpDigits(['', '', '', '', '', '']);
    setError('');
    setResendSeconds(30);
    setTimeout(() => inputRefs.current[0]?.focus(), 80);
  };

  const verifyOtpCode = (entered: string) => {
    if (entered === generatedOtp) {
      setError('');
      setStep('verified');
      setTimeout(() => {
        onSuccess(`${countryCode} ${cleanDigits}`);
      }, 650);
    } else {
      setError('Invalid OTP code. Check the generated SMS code above.');
    }
  };

  const handleDigitChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...otpDigits];
    next[index] = digit;
    setOtpDigits(next);
    setError('');

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    const joined = next.join('');
    if (joined.length === 6) {
      verifyOtpCode(joined);
    }
  };

  const handleDigitKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePasteOtp = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, 6);
    if (pasted.length === 6) {
      e.preventDefault();
      const split = pasted.split('');
      setOtpDigits(split);
      verifyOtpCode(pasted);
    }
  };

  const handleAutoFillDemo = () => {
    if (!generatedOtp) return;
    const split = generatedOtp.split('');
    setOtpDigits(split);
    verifyOtpCode(generatedOtp);
  };

  return (
    <div className="relative flex h-screen w-screen flex-col items-center justify-center overflow-hidden bg-[#09090c] px-5 text-[#f3f3f6]">
      <AmbientBackdrop
        imageSrc="/posters/drama.jpg"
        ambientTint="rgba(229, 9, 20, 0.16)"
      />

      {/* Simulated SMS Notification Pill showing the generated OTP */}
      <AnimatePresence>
        {step === 'otp' && generatedOtp && (
          <motion.div
            initial={{ opacity: 0, y: -18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="fixed top-5 z-30 flex items-center gap-3 rounded-full border border-[#d4a853]/35 bg-[#121218]/95 px-4 py-2 shadow-[0_14px_40px_rgba(0,0,0,0.75)] backdrop-blur-xl"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#d4a853]/15 text-[#d4a853]">
              <KeyRound className="h-3.5 w-3.5" />
            </span>
            <p className="text-xs text-white/80">
              CINE GO SMS OTP:{' '}
              <span className="font-mono text-sm font-bold tracking-[0.2em] text-[#d4a853]">
                {generatedOtp}
              </span>
            </p>
            <button
              type="button"
              onClick={handleAutoFillDemo}
              className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white hover:bg-white/20 transition-colors cursor-pointer"
            >
              Auto-Fill
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Auth Card */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 1.03 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-[420px] rounded-2xl border border-white/[0.08] bg-[#0e0e13]/85 p-7 sm:p-9 shadow-[0_30px_90px_rgba(0,0,0,0.85)] backdrop-blur-2xl"
      >
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center">
          <span className="font-display text-6xl leading-none tracking-[0.16em] text-[#e50914] drop-shadow-[0_0_26px_rgba(229,9,20,0.45)]">
            CINE GO
          </span>
          <p className="mt-2 flex items-center gap-1.5 text-xs uppercase tracking-[0.22em] text-white/55">
            <Sparkles className="h-3.5 w-3.5 text-[#d4a853]" />
            AI Cinema Discovery &amp; Booking
          </p>
        </div>

        <div className="my-6 h-px w-full bg-white/[0.07]" />

        <AnimatePresence mode="wait">
          {step === 'phone' && (
            <motion.form
              key="phone-step"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              onSubmit={handleSendOtp}
              className="space-y-5"
            >
              <div>
                <h1 className="text-xl font-medium tracking-wide text-white">
                  Sign in with Mobile
                </h1>
                <p className="mt-1 text-[13.5px] text-white/55">
                  Enter your mobile number to receive a one-time verification
                  passcode.
                </p>
              </div>

              <div>
                <label className="block text-[11.5px] uppercase tracking-[0.18em] text-white/50">
                  Mobile Number
                </label>
                <div className="mt-2 flex items-center gap-2">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="rounded-lg border border-white/12 bg-[#14141b] px-3 py-3 text-[13.5px] font-medium text-white/90 focus:border-[#e50914] focus:outline-none cursor-pointer"
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code} className="bg-[#121218]">
                        {c.label}
                      </option>
                    ))}
                  </select>

                  <div className="relative flex-1">
                    <Smartphone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                    <input
                      type="tel"
                      inputMode="numeric"
                      autoFocus
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        setError('');
                      }}
                      placeholder="98765 43210"
                      className="w-full rounded-lg border border-white/12 bg-[#14141b] py-3 pl-9 pr-3.5 text-[15px] tracking-wider text-white placeholder:text-white/25 focus:border-[#e50914] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {error && (
                <p className="text-[13px] text-[#ff5c65]">{error}</p>
              )}

              <button
                type="submit"
                className="group flex w-full items-center justify-center gap-2 rounded-lg bg-[#e50914] py-3.5 text-[13px] font-semibold uppercase tracking-[0.18em] text-white shadow-[0_10px_28px_rgba(229,9,20,0.4)] hover:bg-[#f6121d] active:scale-[0.99] transition-all cursor-pointer"
              >
                <span>Generate OTP</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </motion.form>
          )}

          {step === 'otp' && (
            <motion.div
              key="otp-step"
              initial={{ opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -14 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-5"
            >
              <div>
                <h1 className="text-lg font-medium tracking-wide text-white">
                  Verify Passcode
                </h1>
                <p className="mt-1 text-xs text-white/50">
                  Sent 6-digit OTP to{' '}
                  <span className="text-white/85 font-medium">
                    {countryCode} {cleanDigits}
                  </span>
                </p>
              </div>

              {/* 6-digit OTP Input Boxes */}
              <div
                onPaste={handlePasteOtp}
                className="grid grid-cols-6 gap-2 pt-1"
              >
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      inputRefs.current[idx] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                    className="h-12 w-full rounded-lg border border-white/15 bg-[#14141b] text-center font-mono text-lg font-semibold text-white focus:border-[#e50914] focus:bg-[#1a1a24] focus:outline-none transition-colors"
                    aria-label={`OTP digit ${idx + 1}`}
                  />
                ))}
              </div>

              {error && <p className="text-xs text-[#ff5c65]">{error}</p>}

              <button
                type="button"
                onClick={() => verifyOtpCode(otpDigits.join(''))}
                disabled={otpDigits.join('').length < 6}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#e50914] py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white shadow-[0_10px_28px_rgba(229,9,20,0.4)] hover:bg-[#f6121d] disabled:opacity-35 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>Verify &amp; Enter CINE GO</span>
              </button>

              <div className="flex items-center justify-between pt-1 text-[11px] text-white/45">
                <button
                  type="button"
                  onClick={() => {
                    setStep('phone');
                    setError('');
                  }}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Change Number
                </button>

                <button
                  type="button"
                  disabled={resendSeconds > 0}
                  onClick={handleResend}
                  className="inline-flex items-center gap-1 hover:text-white disabled:opacity-45 transition-colors cursor-pointer"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>
                    {resendSeconds > 0
                      ? `Resend in ${resendSeconds}s`
                      : 'Resend OTP'}
                  </span>
                </button>
              </div>
            </motion.div>
          )}

          {step === 'verified' && (
            <motion.div
              key="verified-step"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center py-6 text-center"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h2 className="mt-3 text-base font-medium tracking-wide text-white">
                Verified · Welcome to CINE GO
              </h2>
              <p className="mt-1 text-xs text-white/45">
                Preparing your personalized cinema discovery stage...
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
