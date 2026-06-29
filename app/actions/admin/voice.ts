"use server";

import { requireAdmin } from "@/lib/admin/auth";
import { isSuperAdmin } from "@/lib/admin/permissions";
import type { VoiceUserEvent } from "@/lib/admin/voice";
import {
  countJoinedParticipants,
  createVoiceCall,
  endCallRows,
  getActiveCallForUser,
  getActiveCallInConversation,
  getCallById,
  getCallDetails,
  getConversationMemberIds,
  getProfileName,
  joinGroupCallRows,
  markCallMissed,
  updateCallStatus,
  updateParticipantStatus,
  userHasActiveCall,
  type ActiveCallDetails,
} from "@/lib/db/admin/voice";
import { getConversationById, isMember } from "@/lib/db/admin/messages";

export type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

async function requireCallMember(conversationId: string) {
  const user = await requireAdmin();
  const member = await isMember(conversationId, user.id);
  if (!member) {
    if (isSuperAdmin(user)) {
      throw new Error("Audit view — read only.");
    }
    throw new Error("Not a member of this conversation.");
  }
  return user;
}

export async function fetchActiveCallAction(): Promise<ActiveCallDetails | null> {
  const user = await requireAdmin();
  return getActiveCallForUser(user.id);
}

export async function startCallAction(
  conversationId: string,
): Promise<ActionResult<ActiveCallDetails>> {
  try {
    const user = await requireCallMember(conversationId);
    const conversation = await getConversationById(conversationId);
    if (!conversation) {
      return { success: false, error: "Conversation not found." };
    }

    const existing = await getActiveCallInConversation(conversationId);
    if (existing && existing.status === "active") {
      const joined = await countJoinedParticipants(existing.id);
      if (joined < 6) {
        return joinGroupCallAction(conversationId);
      }
    }

    if (await userHasActiveCall(user.id)) {
      return {
        success: false,
        error: "Pehle current call khatam karein.",
      };
    }

    const calleeIds = await getConversationMemberIds(conversationId, user.id);
    if (!calleeIds.length) {
      return { success: false, error: "No one else to call." };
    }

    const call = await createVoiceCall(conversationId, user.id, calleeIds);
    return { success: true, data: call };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Could not start call.",
    };
  }
}

export async function joinGroupCallAction(
  conversationId: string,
): Promise<ActionResult<ActiveCallDetails>> {
  try {
    const user = await requireCallMember(conversationId);
    const existing = await getActiveCallInConversation(conversationId);

    if (!existing || existing.status !== "active") {
      return { success: false, error: "No active call in this group." };
    }

    if (await userHasActiveCall(user.id)) {
      const active = await getActiveCallForUser(user.id);
      if (active?.id !== existing.id) {
        return {
          success: false,
          error: "Pehle current call khatam karein.",
        };
      }
      const details = await getCallDetails(existing.id);
      if (!details) return { success: false, error: "Call not found." };
      return { success: true, data: details };
    }

    await joinGroupCallRows(existing.id, user.id);
    const details = await getCallDetails(existing.id);
    if (!details) return { success: false, error: "Call not found." };
    return { success: true, data: details };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Could not join call.",
    };
  }
}

export async function respondToCallAction(
  callId: string,
  response: "accept" | "decline",
): Promise<ActionResult<ActiveCallDetails>> {
  try {
    const user = await requireAdmin();
    const call = await getCallById(callId);
    if (!call) return { success: false, error: "Call not found." };

    const member = await isMember(call.conversationId, user.id);
    if (!member) {
      return { success: false, error: "Access denied." };
    }

    if (call.status !== "ringing" && call.status !== "active") {
      return { success: false, error: "Call no longer active." };
    }

    if (response === "decline") {
      await updateParticipantStatus(callId, user.id, "declined");
      const joined = await countJoinedParticipants(callId);
      if (joined < 2) {
        await endCallRows(callId);
      }
      const details = await getCallDetails(callId);
      if (!details) return { success: false, error: "Call not found." };
      return { success: true, data: details };
    }

    if (await userHasActiveCall(user.id)) {
      const active = await getActiveCallForUser(user.id);
      if (active?.id !== callId) {
        return {
          success: false,
          error: "Pehle current call khatam karein.",
        };
      }
    }

    await updateParticipantStatus(callId, user.id, "joined");
    const joined = await countJoinedParticipants(callId);

    if (joined >= 2 && call.status === "ringing") {
      await updateCallStatus(callId, "active", {
        startedAt: new Date().toISOString(),
      });
    }

    const details = await getCallDetails(callId);
    if (!details) return { success: false, error: "Call not found." };
    return { success: true, data: details };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Could not respond to call.",
    };
  }
}

export async function endCallAction(
  callId: string,
): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    const call = await getCallById(callId);
    if (!call) return { success: false, error: "Call not found." };

    const member = await isMember(call.conversationId, user.id);
    if (!member) {
      return { success: false, error: "Access denied." };
    }

    await updateParticipantStatus(callId, user.id, "left");

    const joined = await countJoinedParticipants(callId);
    if (joined < 2 || call.status === "ringing") {
      await endCallRows(callId);
    }

    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Could not end call.",
    };
  }
}

export async function cancelCallAction(
  callId: string,
): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    const call = await getCallById(callId);
    if (!call) return { success: false, error: "Call not found." };

    if (call.initiatedBy !== user.id) {
      return { success: false, error: "Only the caller can cancel." };
    }

    if (call.status !== "ringing") {
      return { success: false, error: "Call cannot be cancelled." };
    }

    await endCallRows(callId);
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Could not cancel call.",
    };
  }
}

export async function timeoutCallAction(
  callId: string,
): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    const call = await getCallById(callId);
    if (!call) return { success: true };

    if (call.initiatedBy !== user.id && call.status === "ringing") {
      return { success: true };
    }

    if (call.status !== "ringing") return { success: true };

    const joined = await countJoinedParticipants(callId);
    if (joined >= 2) return { success: true };

    await markCallMissed(callId);
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Timeout failed.",
    };
  }
}

export async function buildIncomingEvent(
  call: ActiveCallDetails,
  calleeId: string,
): Promise<VoiceUserEvent | null> {
  const participant = call.participants.find((p) => p.userId === calleeId);
  if (!participant || !["invited", "ringing"].includes(participant.status)) {
    return null;
  }

  const caller = call.participants.find((p) => p.userId === call.initiatedBy);
  return {
    type: "incoming",
    callId: call.id,
    conversationId: call.conversationId,
    callerId: call.initiatedBy,
    callerName: caller?.name ?? (await getProfileName(call.initiatedBy)),
    conversationLabel: call.conversationLabel,
    isGroup: call.isGroup,
  };
}
