"use client";

import { useState } from "react";

type OrderNumberDisplayProps = {
  orderNumber: string;
};

export function OrderNumberDisplay({ orderNumber }: OrderNumberDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(orderNumber);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="rounded-2xl border-2 border-primary bg-primary-light p-6 text-center">
      <p className="text-sm font-semibold text-body">Order Number</p>
      <button
        type="button"
        onClick={handleCopy}
        className="mt-2 font-mono text-3xl font-bold tracking-wider text-primary md:text-4xl"
      >
        {orderNumber}
      </button>
      <p className="mt-2 text-sm text-muted">
        {copied ? "Copy ho gaya ✅" : "Tap karke copy karein"}
      </p>
    </div>
  );
}
