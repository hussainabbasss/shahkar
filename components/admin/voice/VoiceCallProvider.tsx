"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  cancelCallAction,
  endCallAction,
  fetchActiveCallAction,
  respondToCallAction,
  startCallAction,
  timeoutCallAction,
} from "@/app/actions/admin/voice";
import { VoiceCallOverlay } from "@/components/admin/voice/VoiceCallOverlay";
import { useCallRingtone, useRingbackTone } from "@/components/admin/voice/useCallRingtone";
import { useVoiceCall } from "@/components/admin/voice/useVoiceCall";
import {
  ICE_FAILURE_END_MS,
  RING_TIMEOUT_MS,
  type VoiceOverlayPhase,
  type VoiceUserEvent,
  voiceUserChannel,
} from "@/lib/admin/voice";
import type { ActiveCallDetails } from "@/lib/db/admin/voice";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

type VoiceCallContextValue = {
  phase: VoiceOverlayPhase;
  inCall: boolean;
  startCall: (conversationId: string) => Promise<{ ok: boolean; error?: string }>;
  hasActiveCall: boolean;
};

const VoiceCallContext = createContext<VoiceCallContextValue | null>(null);

type VoiceCallProviderProps = {
  userId: string;
  userName: string;
  children: ReactNode;
};

export function VoiceCallProvider({
  userId,
  userName,
  children,
}: VoiceCallProviderProps) {
  const [call, setCall] = useState<ActiveCallDetails | null>(null);
  const [phase, setPhase] = useState<VoiceOverlayPhase>("idle");
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [remoteNames, setRemoteNames] = useState<Map<string, string>>(
    () => new Map(),
  );
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(
    () => new Map(),
  );
  const ringTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const iceFailRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const connectedPeersRef = useRef<Set<string>>(new Set());
  const handleEndCallRef = useRef<() => Promise<void>>(async () => {});

  const { play: playRingtone, stop: stopRingtone, unlockAndPlay, needsTap } =
    useCallRingtone();
  const { play: playRingback, stop: stopRingback } = useRingbackTone();

  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2500);
  }, []);

  const isCaller = call?.initiatedBy === userId;
  const joinedPeers =
    call?.participants.filter((p) => p.status === "joined") ?? [];

  const broadcastUserEvent = useCallback(
    async (targetUserId: string, event: VoiceUserEvent) => {
      const supabase = createBrowserSupabaseClient();
      const channel = supabase.channel(voiceUserChannel(targetUserId));
      await channel.subscribe();
      await channel.send({
        type: "broadcast",
        event: "voice",
        payload: event,
      });
      void supabase.removeChannel(channel);
    },
    [],
  );

  const notifyCallees = useCallback(
    async (details: ActiveCallDetails) => {
      const caller = details.participants.find(
        (p) => p.userId === details.initiatedBy,
      );
      for (const p of details.participants) {
        if (p.userId === userId) continue;
        if (!["invited", "ringing"].includes(p.status)) continue;
        const event: VoiceUserEvent = {
          type: "incoming",
          callId: details.id,
          conversationId: details.conversationId,
          callerId: details.initiatedBy,
          callerName: caller?.name ?? "Staff",
          conversationLabel: details.conversationLabel,
          isGroup: details.isGroup,
        };
        await broadcastUserEvent(p.userId, event);
      }
    },
    [broadcastUserEvent, userId],
  );

  const teardown = useCallback(
    (message?: string) => {
      if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);
      if (iceFailRef.current) clearTimeout(iceFailRef.current);
      stopRingtone();
      stopRingback();
      connectedPeersRef.current.clear();
      setRemoteStreams(new Map());
      setRemoteNames(new Map());
      setMuted(false);
      setError(null);
      if (message) showToast(message);
      setPhase("idle");
      setCall(null);
      setElapsed(0);
    },
    [showToast, stopRingback, stopRingtone],
  );

  const hydrateFromServer = useCallback(
    async (details: ActiveCallDetails) => {
      setCall(details);
      const me = details.participants.find((p) => p.userId === userId);
      if (!me) {
        setPhase("idle");
        return;
      }

      if (details.status === "ended" || details.status === "missed") {
        teardown(
          details.status === "missed" ? "Missed call" : "Call ended",
        );
        return;
      }

      if (details.initiatedBy === userId && details.status === "ringing") {
        setPhase("outgoing");
        void playRingback();
        return;
      }

      if (
        ["invited", "ringing"].includes(me.status) &&
        details.status === "ringing"
      ) {
        setPhase("incoming");
        void playRingtone();
        return;
      }

      if (me.status === "joined" && details.status === "active") {
        setPhase("active");
        stopRingtone();
        stopRingback();
      }
    },
    [playRingback, playRingtone, stopRingback, stopRingtone, teardown, userId],
  );

  const onRemoteStream = useCallback((peerId: string, stream: MediaStream) => {
    setRemoteStreams((prev) => new Map(prev).set(peerId, stream));
    connectedPeersRef.current.add(peerId);
  }, []);

  const onPeerLeft = useCallback((peerId: string) => {
    setRemoteStreams((prev) => {
      const next = new Map(prev);
      next.delete(peerId);
      return next;
    });
    connectedPeersRef.current.delete(peerId);
  }, []);

  const onIceFailed = useCallback(() => {
    setError("Connection weak — try again");
    if (iceFailRef.current) clearTimeout(iceFailRef.current);
    iceFailRef.current = setTimeout(() => {
      void handleEndCallRef.current();
    }, ICE_FAILURE_END_MS);
  }, []);

  const webrtcEnabled = phase === "active" && !!call?.id;

  const {
    ensureLocalStream,
    connectToPeer,
    setMuted: setWebRtcMuted,
    leaveCall,
    cleanupAll,
  } = useVoiceCall({
    callId: call?.id ?? null,
    userId,
    enabled: webrtcEnabled,
    onRemoteStream,
    onPeerLeft,
    onIceFailed,
  });

  const connectMesh = useCallback(
    async (details: ActiveCallDetails) => {
      const joined = details.participants.filter((p) => p.status === "joined");
      const names = new Map<string, string>();
      for (const p of joined) {
        if (p.name) names.set(p.userId, p.name);
      }
      setRemoteNames(names);

      try {
        await ensureLocalStream();
      } catch {
        setError("Microphone permission denied.");
        return;
      }

      for (const p of joined) {
        if (p.userId === userId) continue;
        const isInitiator = userId < p.userId;
        await connectToPeer(p.userId, isInitiator);
      }
    },
    [connectToPeer, ensureLocalStream, userId],
  );

  const handleStartCall = useCallback(
    async (conversationId: string) => {
      setError(null);
      try {
        await ensureLocalStream();
      } catch {
        return { ok: false, error: "Microphone permission denied." };
      }

      const result = await startCallAction(conversationId);
      if (!result.success) {
        return { ok: false, error: result.error };
      }
      if (!result.data) {
        return { ok: false, error: "Could not start call." };
      }

      setCall(result.data);
      setPhase("outgoing");
      void playRingback();
      await notifyCallees(result.data);

      if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);
      ringTimeoutRef.current = setTimeout(() => {
        void timeoutCallAction(result.data!.id).then(() => {
          void fetchActiveCallAction().then((fresh) => {
            if (fresh?.status === "missed") {
              for (const p of result.data!.participants) {
                if (p.userId !== userId) {
                  void broadcastUserEvent(p.userId, {
                    type: "missed",
                    callId: result.data!.id,
                    callerName: userName,
                  });
                }
              }
              teardown("No answer");
            }
          });
        });
      }, RING_TIMEOUT_MS);

      return { ok: true };
    },
    [
      broadcastUserEvent,
      ensureLocalStream,
      notifyCallees,
      playRingback,
      teardown,
      userId,
      userName,
    ],
  );

  const handleAccept = useCallback(async () => {
    if (!call) return;
    stopRingtone();
    setError(null);
    try {
      await ensureLocalStream();
    } catch {
      setError("Microphone permission denied.");
      await endCallAction(call.id);
      teardown("Microphone permission denied.");
      return;
    }

    const result = await respondToCallAction(call.id, "accept");
    if (!result.success) {
      setError(result.error);
      return;
    }
    if (!result.data) {
      setError("Could not accept call.");
      return;
    }

    setCall(result.data);
    if (result.data.status === "active") {
      setPhase("active");
      stopRingback();
      if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);
      await connectMesh(result.data);
    }
  }, [
    call,
    connectMesh,
    ensureLocalStream,
    stopRingback,
    stopRingtone,
    teardown,
  ]);

  const handleDecline = useCallback(async () => {
    if (!call) return;
    stopRingtone();
    await respondToCallAction(call.id, "decline");
    if (isCaller) {
      await cancelCallAction(call.id);
      for (const p of call.participants) {
        if (p.userId !== userId) {
          void broadcastUserEvent(p.userId, {
            type: "cancelled",
            callId: call.id,
          });
        }
      }
    }
    teardown("Call ended");
  }, [broadcastUserEvent, call, isCaller, stopRingtone, teardown, userId]);

  const handleCancel = useCallback(async () => {
    if (!call) return;
    stopRingback();
    await cancelCallAction(call.id);
    for (const p of call.participants) {
      if (p.userId !== userId) {
        void broadcastUserEvent(p.userId, {
          type: "cancelled",
          callId: call.id,
        });
      }
    }
    teardown("Call ended");
  }, [broadcastUserEvent, call, stopRingback, teardown, userId]);

  const handleEndCall = useCallback(async () => {
    if (!call) return;
    leaveCall();
    cleanupAll();
    await endCallAction(call.id);
    for (const p of call.participants) {
      if (p.userId !== userId) {
        void broadcastUserEvent(p.userId, {
          type: "ended",
          callId: call.id,
        });
      }
    }
    teardown("Call ended");
  }, [
    broadcastUserEvent,
    call,
    cleanupAll,
    leaveCall,
    teardown,
    userId,
  ]);

  handleEndCallRef.current = handleEndCall;

  const handleToggleMute = useCallback(() => {
    setMuted((m) => {
      setWebRtcMuted(!m);
      return !m;
    });
  }, [setWebRtcMuted]);

  useEffect(() => {
    void fetchActiveCallAction().then((active) => {
      if (active) void hydrateFromServer(active);
    });
  }, [hydrateFromServer]);

  useEffect(() => {
    if (phase !== "active") return;
    const start = Date.now();
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [phase, call?.id]);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();

    const userChannel = supabase
      .channel(voiceUserChannel(userId), {
        config: { broadcast: { self: false } },
      })
      .on("broadcast", { event: "voice" }, ({ payload }) => {
        const event = payload as VoiceUserEvent;
        if (event.type === "incoming") {
          void fetchActiveCallAction().then((details) => {
            if (details && details.id === event.callId) {
              void hydrateFromServer(details);
            }
          });
        }
        if (event.type === "cancelled" && call?.id === event.callId) {
          teardown("Call ended");
        }
        if (event.type === "ended" && call?.id === event.callId) {
          leaveCall();
          cleanupAll();
          teardown("Call ended");
        }
        if (event.type === "missed" && call?.id === event.callId) {
          teardown(`Missed call from ${event.callerName}`);
        }
      })
      .subscribe();

    const participantChannel = supabase
      .channel(`voice-participants:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "admin_voice_call_participants",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          void fetchActiveCallAction().then((details) => {
            if (!details) {
              if (phase !== "idle") teardown();
              return;
            }
            void hydrateFromServer(details);
            if (details.status === "active" && phase !== "active") {
              void connectMesh(details);
            }
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "admin_voice_calls",
        },
        () => {
          void fetchActiveCallAction().then((details) => {
            if (details) void hydrateFromServer(details);
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(userChannel);
      void supabase.removeChannel(participantChannel);
    };
  }, [
    call?.id,
    cleanupAll,
    connectMesh,
    hydrateFromServer,
    leaveCall,
    phase,
    teardown,
    userId,
  ]);

  const inCall = phase !== "idle";
  const hasActiveCall = inCall;

  const value = useMemo(
    () => ({
      phase,
      inCall,
      startCall: handleStartCall,
      hasActiveCall,
    }),
    [handleStartCall, hasActiveCall, inCall, phase],
  );

  return (
    <VoiceCallContext.Provider value={value}>
      {children}
      <VoiceCallOverlay
        phase={phase}
        call={call}
        userId={userId}
        muted={muted}
        elapsed={elapsed}
        error={error}
        needsTap={needsTap}
        remoteNames={remoteNames}
        remoteStreams={remoteStreams}
        joinedPeers={joinedPeers}
        onAccept={() => void handleAccept()}
        onDecline={() => void handleDecline()}
        onCancel={() => void handleCancel()}
        onEnd={() => void handleEndCall()}
        onToggleMute={handleToggleMute}
        onUnlockRingtone={() => void unlockAndPlay()}
      />
      {toast && (
        <div className="fixed bottom-4 left-1/2 z-[210] -translate-x-1/2 rounded-lg bg-[#1B6B3A] px-4 py-3 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </VoiceCallContext.Provider>
  );
}

export function useVoiceCallContext() {
  const ctx = useContext(VoiceCallContext);
  if (!ctx) {
    throw new Error("useVoiceCallContext must be used within VoiceCallProvider");
  }
  return ctx;
}

export function useVoiceCallContextOptional() {
  return useContext(VoiceCallContext);
}
