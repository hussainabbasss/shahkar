"use client";

import { useEffect, useState } from "react";
import type { Sale } from "@/lib/types";

type SaleBannerProps = {
  sale: Sale;
};

function getTimeLeft(endDate: string) {
  const diff = Math.max(0, new Date(endDate).getTime() - Date.now());
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { diff, days, hours, minutes, seconds };
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function SaleBanner({ sale }: SaleBannerProps) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(sale.endDate));
  const [visible, setVisible] = useState(timeLeft.diff > 0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const next = getTimeLeft(sale.endDate);
      setTimeLeft(next);
      setVisible(next.diff > 0);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [sale.endDate]);

  if (!visible) return null;

  const timer = `${pad(timeLeft.days)}:${pad(timeLeft.hours)}:${pad(timeLeft.minutes)}:${pad(timeLeft.seconds)}`;

  return (
    <div
      className="overflow-x-clip bg-accent px-4 text-sm font-semibold text-white"
      role="banner"
      aria-label="Active sale"
    >
      <div className="mx-auto flex h-12 w-full max-w-7xl min-w-0 items-center justify-between gap-2 md:h-[52px] md:gap-3 md:text-base">
        <span className="min-w-0 flex-1 truncate">{sale.name}</span>
        <span
          className="shrink-0 rounded bg-black/20 px-1 py-0.5 font-mono text-[10px] tracking-wide sm:text-xs sm:tracking-widest"
          aria-live="polite"
        >
          {timer}
        </span>
        {sale.couponCode && (
          <span className="hidden shrink-0 md:inline">
            Code: {sale.couponCode}
          </span>
        )}
      </div>
    </div>
  );
}
