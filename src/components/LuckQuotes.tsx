const LUCK_QUOTES = [
  "Fortune favors the bold.",
  "The harder you work, the luckier you get.",
  "Luck is what happens when preparation meets opportunity.",
];

export function LuckQuotes() {
  const quote = LUCK_QUOTES[0];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-violet-200/80 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50/50 px-5 py-4 shadow-sm">
      <div className="absolute left-3 top-2 text-5xl font-serif leading-none text-violet-300/70">
        &ldquo;
      </div>
      <p className="relative text-center text-base font-medium italic leading-snug text-violet-900 sm:text-lg">
        {quote}
      </p>
      <p className="mt-2 text-center text-[10px] font-semibold uppercase tracking-widest text-violet-500">
        A little luck
      </p>
    </div>
  );
}
