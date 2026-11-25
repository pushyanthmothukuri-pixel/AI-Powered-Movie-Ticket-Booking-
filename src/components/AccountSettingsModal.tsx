import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';

interface AccountSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  onUpdateUserName: (name: string) => void;
  preferredFormat: string;
  onUpdatePreferredFormat: (fmt: string) => void;
}

const FORMATS = ['IMAX 2D', 'Dolby Atmos', '4DX', 'Laser 2D'];

export const AccountSettingsModal: React.FC<AccountSettingsModalProps> = ({
  isOpen,
  onClose,
  userName,
  onUpdateUserName,
  preferredFormat,
  onUpdatePreferredFormat,
}) => {
  const [draftName, setDraftName] = useState(userName);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (draftName.trim()) {
      onUpdateUserName(draftName.trim());
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xl"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="Account Settings"
        >
          <motion.form
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            onSubmit={handleSave}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-xl border border-white/10 bg-[#101016] p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3.5">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-white">
                  Account Settings
                </h2>
                <p className="mt-0.5 text-[11px] text-white/45">
                  Personalize your CINE GO AI profile
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-1.5 text-white/50 hover:text-white cursor-pointer"
                aria-label="Close settings"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-[0.18em] text-white/50">
                  Display Name
                </label>
                <input
                  type="text"
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-white/15 bg-white/[0.03] px-3.5 py-2.5 text-sm text-white focus:border-[#e50914] focus:outline-none"
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-white/50">
                  <Sparkles className="h-3 w-3 text-[#d4a853]" />
                  AI Preferred Screening Format
                </label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {FORMATS.map((fmt) => (
                    <button
                      type="button"
                      key={fmt}
                      onClick={() => onUpdatePreferredFormat(fmt)}
                      className={`rounded-lg border px-3 py-2 text-xs transition-all cursor-pointer ${
                        preferredFormat === fmt
                          ? 'border-[#e50914] bg-[#e50914]/15 text-white'
                          : 'border-white/10 bg-white/[0.02] text-white/60 hover:border-white/25'
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-white/15 px-4 py-2 text-xs text-white/70 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-md bg-[#e50914] px-5 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white hover:bg-[#f6121d] cursor-pointer"
              >
                Save Preferences
              </button>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
