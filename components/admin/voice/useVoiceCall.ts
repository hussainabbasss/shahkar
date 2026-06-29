"use client";

import { useCallback, useEffect, useRef } from "react";
import type { VoiceSignal } from "@/lib/admin/voice";
import { voiceCallChannel } from "@/lib/admin/voice";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

type UseVoiceCallOptions = {
  callId: string | null;
  userId: string;
  enabled: boolean;
  onRemoteStream: (peerId: string, stream: MediaStream) => void;
  onPeerLeft: (peerId: string) => void;
  onIceFailed: () => void;
};

async function fetchIceServers(): Promise<RTCIceServer[]> {
  const res = await fetch("/api/admin/voice/ice-servers");
  if (!res.ok) throw new Error("Failed to load ICE servers");
  const data = (await res.json()) as { iceServers: RTCIceServer[] };
  return data.iceServers;
}

export function useVoiceCall({
  callId,
  userId,
  enabled,
  onRemoteStream,
  onPeerLeft,
  onIceFailed,
}: UseVoiceCallOptions) {
  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const channelRef = useRef<ReturnType<
    ReturnType<typeof createBrowserSupabaseClient>["channel"]
  > | null>(null);
  const iceServersRef = useRef<RTCIceServer[] | null>(null);

  const sendSignal = useCallback(
    (payload: VoiceSignal) => {
      if (!channelRef.current || !callId) return;
      void channelRef.current.send({
        type: "broadcast",
        event: "signal",
        payload,
      });
    },
    [callId],
  );

  const cleanupPeer = useCallback(
    (peerId: string) => {
      const pc = peersRef.current.get(peerId);
      if (pc) {
        pc.close();
        peersRef.current.delete(peerId);
      }
      onPeerLeft(peerId);
    },
    [onPeerLeft],
  );

  const cleanupAll = useCallback(() => {
    for (const peerId of peersRef.current.keys()) {
      cleanupPeer(peerId);
    }
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    if (channelRef.current) {
      const supabase = createBrowserSupabaseClient();
      void supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, [cleanupPeer]);

  const ensureLocalStream = useCallback(async () => {
    if (localStreamRef.current) return localStreamRef.current;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    localStreamRef.current = stream;
    return stream;
  }, []);

  const createPeer = useCallback(
    async (peerId: string, isInitiator: boolean) => {
      if (peersRef.current.has(peerId)) return peersRef.current.get(peerId)!;

      if (!iceServersRef.current) {
        iceServersRef.current = await fetchIceServers();
      }

      const pc = new RTCPeerConnection({
        iceServers: iceServersRef.current,
      });

      const localStream = await ensureLocalStream();
      for (const track of localStream.getTracks()) {
        pc.addTrack(track, localStream);
      }

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignal({
            type: "ice",
            from: userId,
            to: peerId,
            candidate: event.candidate.toJSON(),
          });
        }
      };

      pc.ontrack = (event) => {
        const stream = event.streams[0];
        if (stream) onRemoteStream(peerId, stream);
      };

      pc.onconnectionstatechange = () => {
        if (
          pc.connectionState === "failed" ||
          pc.connectionState === "disconnected"
        ) {
          onIceFailed();
        }
        if (pc.connectionState === "closed") {
          cleanupPeer(peerId);
        }
      };

      peersRef.current.set(peerId, pc);

      if (isInitiator) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        sendSignal({ type: "offer", from: userId, sdp: offer });
      }

      return pc;
    },
    [
      cleanupPeer,
      ensureLocalStream,
      onIceFailed,
      onRemoteStream,
      sendSignal,
      userId,
    ],
  );

  const handleSignal = useCallback(
    async (payload: VoiceSignal) => {
      if (payload.from === userId) return;

      if (payload.type === "leave") {
        cleanupPeer(payload.from);
        return;
      }

      if (payload.type === "offer") {
        const pc = await createPeer(payload.from, false);
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        sendSignal({
          type: "answer",
          from: userId,
          to: payload.from,
          sdp: answer,
        });
        return;
      }

      if (payload.type === "answer" && payload.to === userId) {
        const pc = peersRef.current.get(payload.from);
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        }
        return;
      }

      if (payload.type === "ice" && payload.to === userId) {
        const pc = peersRef.current.get(payload.from);
        if (pc && payload.candidate) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
          } catch {
            // stale candidate
          }
        }
      }
    },
    [cleanupPeer, createPeer, sendSignal, userId],
  );

  const connectToPeer = useCallback(
    async (peerId: string, isInitiator: boolean) => {
      if (peerId === userId) return;
      await createPeer(peerId, isInitiator);
    },
    [createPeer, userId],
  );

  const setMuted = useCallback((muted: boolean) => {
    localStreamRef.current
      ?.getAudioTracks()
      .forEach((t) => {
        t.enabled = !muted;
      });
  }, []);

  const leaveCall = useCallback(() => {
    sendSignal({ type: "leave", from: userId });
    cleanupAll();
  }, [cleanupAll, sendSignal, userId]);

  useEffect(() => {
    if (!enabled || !callId) return;

    const supabase = createBrowserSupabaseClient();
    const channel = supabase
      .channel(voiceCallChannel(callId), {
        config: { broadcast: { self: false } },
      })
      .on("broadcast", { event: "signal" }, ({ payload }) => {
        void handleSignal(payload as VoiceSignal);
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      void supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [callId, enabled, handleSignal]);

  useEffect(() => {
    return () => cleanupAll();
  }, [cleanupAll]);

  return {
    ensureLocalStream,
    connectToPeer,
    setMuted,
    leaveCall,
    cleanupAll,
    getLocalStream: () => localStreamRef.current,
  };
}
