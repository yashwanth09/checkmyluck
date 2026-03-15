"use client";

import { useEffect, useState } from "react";

type Props = {
  closesAt: string;
};

export function GameTimer({ closesAt }: Props) {
  // Avoid hydration mismatch by rendering a placeholder on the server
  // and only starting the ticking timer after mount.
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (now === null) {
    // Initial render on server / before hydration – show static placeholder
    return <span>--:--</span>;
  }

  const end = new Date(closesAt).getTime();
  const diff = end - now;
  const clamped = Math.max(0, diff);
  const minutes = Math.floor(clamped / 60000);
  const seconds = Math.floor((clamped % 60000) / 1000)
    .toString()
    .padStart(2, "0");

  return (
    <span>
      {minutes}:{seconds}
    </span>
  );
}

