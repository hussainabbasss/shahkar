"use client";

import { Mic, MicOff, Phone, PhoneOff } from "lucide-react";
import { formatCallDuration, type VoiceOverlayPhase } from "@/lib/admin/voice";
import type { ActiveCallDetails, VoiceParticipantRow } from "@/lib/db/admin/voice";

type VoiceCallOverlayProps = {
  phase: VoiceOverlayPhase;
  call: ActiveCallDetails | null;
  userId: string;
  muted: boolean;
  elapsed: number;
  error: string | null;
  needsTap: boolean;
  remoteNames: Map<string, string>;
  remoteStreams: Map<string, MediaStream>;
  joinedPeers: VoiceParticipantRow[];
  onAccept: () => void;
  onDecline: () => void;
  onCancel: () => void;
  onEnd: () => void;
  onToggleMute: () => void;
  onUnlockRingtone: () => void;
};

function AvatarPulse({ label }: { label: string }) {
  return (
    <div className="relative flex h-16 w-16 items-center justify-center">
      <span
        className="absolute inset-0 animate-ping rounded-full opacity-30"
        style={{ background: "var(--admin-primary)" }}
      />
      <div
        className="relative flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold text-white"
        style={{ background: "var(--admin-primary)" }}
      >
        {label.charAt(0).toUpperCase()}
      </div>
    </div>
  );
}

export function VoiceCallOverlay({
  phase,
  call,
  userId,
  muted,
  elapsed,
  error,
  needsTap,
  remoteNames,
  remoteStreams,
  joinedPeers,
  onAccept,
  onDecline,
  onCancel,
  onEnd,
  onToggleMute,
  onUnlockRingtone,
}: VoiceCallOverlayProps) {
  if (phase === "idle" || !call) return null;

  const isCaller = call.initiatedBy === userId;
  const caller = call.participants.find((p) => p.userId === call.initiatedBy);
  const title =
    phase === "incoming"
      ? (caller?.name ?? "Staff")
      : call.isGroup
        ? call.conversationLabel
        : call.participants.find((p) => p.userId !== userId)?.name ??
          call.conversationLabel;

  const subtitle =
    phase === "outgoing"
      ? "Calling…"
      : phase === "incoming"
        ? call.conversationLabel
        : phase === "active"
          ? formatCallDuration(elapsed)
          : "";

  const showScrim = phase === "incoming";

  return (
    <div
      className={`fixed inset-0 z-[200] flex items-center justify-center p-4 ${
        showScrim ? "bg-black/50" : "pointer-events-none"
      }`}
    >
      <div
        className="pointer-events-auto w-full max-w-sm rounded-2xl p-6 shadow-2xl"
        style={{
          background: "var(--admin-surface)",
          border: "1px solid var(--admin-border)",
        }}
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <AvatarPulse label={title} />

          <div>
            <h2
              className="text-lg font-bold"
              style={{ color: "var(--admin-text-heading)" }}
            >
              {title}
            </h2>
            <p
              className="text-sm"
              style={{ color: "var(--admin-text-muted)" }}
            >
              {subtitle}
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          {needsTap && phase === "incoming" && (
            <button
              type="button"
              onClick={onUnlockRingtone}
              className="text-sm font-medium underline"
              style={{ color: "var(--admin-primary)" }}
            >
              Tap to hear ringtone
            </button>
          )}

          {phase === "active" && call.isGroup && joinedPeers.length > 0 && (
            <div className="flex max-w-full gap-2 overflow-x-auto pb-1">
              {joinedPeers.map((p) => (
                <span
                  key={p.userId}
                  className="shrink-0 rounded-full px-3 py-1 text-xs font-medium"
                  style={{
                    background:
                      "color-mix(in srgb, var(--admin-primary) 12%, transparent)",
                    color: "var(--admin-text-body)",
                  }}
                >
                  {remoteNames.get(p.userId) ?? p.name ?? "Staff"}
                  {p.userId === userId && muted ? " 🔇" : ""}
                </span>
              ))}
            </div>
          )}

          <div className="flex w-full flex-col gap-3">
            {phase === "incoming" && (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onDecline}
                  className="flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 text-base font-semibold text-white"
                >
                  <PhoneOff size={20} />
                  Reject
                </button>
                <button
                  type="button"
                  onClick={onAccept}
                  className="flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-xl bg-[#16A34A] text-base font-semibold text-white"
                >
                  <Phone size={20} />
                  Jawab dein
                </button>
              </div>
            )}

            {phase === "outgoing" && (
              <button
                type="button"
                onClick={onCancel}
                className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-red-600 text-base font-semibold text-white"
              >
                <PhoneOff size={20} />
                Cancel
              </button>
            )}

            {phase === "active" && (
              <>
                <button
                  type="button"
                  onClick={onToggleMute}
                  className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl text-base font-semibold"
                  style={{
                    border: "1px solid var(--admin-border)",
                    color: "var(--admin-text-body)",
                  }}
                >
                  {muted ? <MicOff size={20} /> : <Mic size={20} />}
                  {muted ? "Mic band" : "Mic on"}
                </button>
                <button
                  type="button"
                  onClick={onEnd}
                  className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-red-600 text-base font-semibold text-white"
                >
                  <PhoneOff size={20} />
                  Call khatam karein
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {phase === "active" &&
        Array.from(remoteStreams.entries()).map(([peerId, stream]) => (
          <RemoteAudio key={peerId} stream={stream} />
        ))}
    </div>
  );
}

function RemoteAudio({ stream }: { stream: MediaStream }) {
  return (
    <audio
      ref={(el) => {
        if (el && el.srcObject !== stream) {
          el.srcObject = stream;
          void el.play().catch(() => {});
        }
      }}
      autoPlay
      playsInline
      className="hidden"
    />
  );
}
