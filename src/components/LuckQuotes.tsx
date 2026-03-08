"use client";

import { useEffect, useState } from "react";

const LUCK_QUOTES = [
  "Fortune favors the bold.",
  "The harder you work, the luckier you get.",
  "Luck is what happens when preparation meets opportunity.",
  "You never know what’s around the corner. It could be everything.",
  "Dare to dream. One draw could change it all.",
  "Sometimes the best things happen when you take a chance.",
  "Believe in your luck — someone wins every day.",
  "A little hope, a small bid, one big win.",
];

const SHUFFLE_INTERVAL_MS = 5000;

function pickOtherQuote(current: string, list: string[]): string {
  const others = list.filter((q) => q !== current);
  if (others.length === 0) return list[0];
  return others[Math.floor(Math.random() * others.length)];
}

export function LuckQuotes() {
  const [quote, setQuote] = useState(LUCK_QUOTES[0]);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const id = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setQuote((prev) => pickOtherQuote(prev, LUCK_QUOTES));
        setVisible(true);
      }, 300);
    }, SHUFFLE_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-violet-200/80 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50/80 px-6 py-5 shadow-md shadow-violet-100/50 ring-1 ring-violet-100/50">
      <div className="absolute right-2 top-2 text-4xl font-serif leading-none text-fuchsia-300/60">
        &rdquo;
      </div>
      <div className="absolute left-3 top-3 text-5xl font-serif leading-none text-violet-300/70">
        &ldquo;
      </div>
      <div
        className={`relative px-2 transition-all duration-300 ${visible ? "opacity-100" : "opacity-0"}`}
      >
        <p className="text-center text-base font-medium italic leading-snug text-violet-900 sm:text-lg">
          {quote}
        </p>
        <p className="mt-2 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-500/90">
          A little luck
        </p>
      </div>
      <div className="mt-3 flex justify-center gap-1">
        {LUCK_QUOTES.map((q) => (
          <span
            key={q}
            className={`h-1 w-1 rounded-full transition-colors ${
              q === quote ? "bg-violet-500" : "bg-violet-200"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
