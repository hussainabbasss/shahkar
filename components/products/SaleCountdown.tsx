"use client";

import { useEffect, useState } from "react";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function SaleCountdown({ endDate }: { endDate: string }) {
  const [timer, setTimer] = useState("");

  useEffect(() => {
    function tick() {
      const diff = Math.max(0, new Date(endDate).getTime() - Date.now());
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      setTimer(
        `${pad(days)}:${pad(hours)}:${pad(minutes)}:${pad(seconds)}`,
      );
    }
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [endDate]);

  if (!timer) return null;

  return (
    <p className="mt-2 font-mono text-sm font-semibold text-accent">
      Sale khatam: {timer}
    </p>
  );
}
