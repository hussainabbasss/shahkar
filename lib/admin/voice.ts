export const MAX_GROUP_CALL_PARTICIPANTS = 6;
export const RING_TIMEOUT_MS = 45_000;
export const ICE_FAILURE_END_MS = 15_000;
export const REALTIME_UNKNOWN_END_MS = 30_000;

export type VoiceCallStatus =
  | "ringing"
  | "active"
  | "ended"
  | "missed"
  | "declined";

export type VoiceParticipantStatus =
  | "invited"
  | "ringing"
  | "joined"
  | "declined"
  | "missed"
  | "left";

export type VoiceSignal =
  | { type: "offer"; from: string; sdp: RTCSessionDescriptionInit }
  | {
      type: "answer";
      from: string;
      to: string;
      sdp: RTCSessionDescriptionInit;
    }
  | {
      type: "ice";
      from: string;
      to: string;
      candidate: RTCIceCandidateInit;
    }
  | { type: "leave"; from: string };

export type VoiceUserEvent =
  | {
      type: "incoming";
      callId: string;
      conversationId: string;
      callerId: string;
      callerName: string;
      conversationLabel: string;
      isGroup: boolean;
    }
  | { type: "cancelled"; callId: string }
  | { type: "ended"; callId: string; reason?: string }
  | { type: "missed"; callId: string; callerName: string };

export type VoiceOverlayPhase =
  | "idle"
  | "outgoing"
  | "incoming"
  | "active"
  | "ending";

export function formatCallDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function voiceUserChannel(userId: string): string {
  return `voice-user:${userId}`;
}

export function voiceCallChannel(callId: string): string {
  return `voice:${callId}`;
}
