"use client";

import { useState } from "react";
import { Phone } from "lucide-react";
import { useVoiceCallContextOptional } from "@/components/admin/voice/VoiceCallProvider";

type CallButtonProps = {
  conversationId: string;
  disabled?: boolean;
};

export function CallButton({ conversationId, disabled }: CallButtonProps) {
  const voice = useVoiceCallContextOptional();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!voice) return null;

  const { startCall, hasActiveCall, inCall } = voice;
  if (inCall) return null;

  const isDisabled = disabled || hasActiveCall || loading;

  async function handleClick() {
    setError(null);
    setLoading(true);
    const result = await startCall(conversationId);
    setLoading(false);
    if (!result.ok) {
      setError(result.error ?? "Could not start call.");
    }
  }

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        title="Voice call"
        disabled={isDisabled}
        onClick={() => void handleClick()}
        className="flex items-center justify-center rounded-lg p-2 disabled:opacity-40"
        style={{
          border: "1.5px solid var(--admin-primary)",
          color: "var(--admin-primary)",
        }}
      >
        <Phone size={18} />
      </button>
      {error && (
        <p
          className="absolute right-0 top-full z-10 mt-1 w-48 rounded px-2 py-1 text-xs text-red-600"
          style={{ background: "var(--admin-surface)" }}
        >
          {error}
        </p>
      )}
    </div>
  );
}
