import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";

// =====================================================================
// CustomSelect — fully-styled dropdown, replaces native <select>.
// Native <option> lists are rendered by the OS/browser and ignore your
// CSS (that's the blue highlight you saw) — this component renders its
// own option list as normal DOM, so every pixel is red/black/white.
//
// Place at: src/components/ui/CustomSelect.tsx
// =====================================================================

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
}

export default function CustomSelect({ value, onChange, options }: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between rounded-lg border px-3 py-2 text-sm text-white bg-white/5 transition
          ${open ? "border-[#E50914] ring-2 ring-[#E50914]/40" : "border-white/10"}`}
      >
        {value}
        <ChevronDown
          className={`w-4 h-4 text-white/40 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute z-30 mt-2 w-full rounded-lg border border-white/10 bg-[#141414]/95 backdrop-blur-xl shadow-[0_12px_32px_rgba(0,0,0,0.5)] overflow-hidden"
          >
            {options.map((opt) => {
              const selected = opt === value;
              return (
                <li key={opt}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(opt);
                      setOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left transition
                      ${
                        selected
                          ? "bg-[#E50914]/15 text-white"
                          : "text-white/70 hover:bg-white/5 hover:text-white"
                      }`}
                  >
                    {opt}
                    {selected && <Check className="w-3.5 h-3.5 text-[#E50914]" />}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
