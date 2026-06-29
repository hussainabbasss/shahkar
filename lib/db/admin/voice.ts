import {
  MAX_GROUP_CALL_PARTICIPANTS,
  type VoiceCallStatus,
  type VoiceParticipantStatus,
} from "@/lib/admin/voice";
import { isMember } from "@/lib/db/admin/messages";
import { createAdminClient } from "@/lib/supabase/admin";

function requireAdmin() {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Supabase not configured");
  return supabase;
}

export type VoiceCallRow = {
  id: string;
  conversationId: string;
  initiatedBy: string;
  status: VoiceCallStatus;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
};

export type VoiceParticipantRow = {
  callId: string;
  userId: string;
  status: VoiceParticipantStatus;
  joinedAt: string | null;
  leftAt: string | null;
  name?: string;
};

export type ActiveCallDetails = VoiceCallRow & {
  participants: VoiceParticipantRow[];
  conversationLabel: string;
  isGroup: boolean;
};

type DbCall = {
  id: string;
  conversation_id: string;
  initiated_by: string;
  status: VoiceCallStatus;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
};

type DbParticipant = {
  call_id: string;
  user_id: string;
  status: VoiceParticipantStatus;
  joined_at: string | null;
  left_at: string | null;
};

function mapCall(row: DbCall): VoiceCallRow {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    initiatedBy: row.initiated_by,
    status: row.status,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    createdAt: row.created_at,
  };
}

function mapParticipant(
  row: DbParticipant,
  name?: string,
): VoiceParticipantRow {
  return {
    callId: row.call_id,
    userId: row.user_id,
    status: row.status,
    joinedAt: row.joined_at,
    leftAt: row.left_at,
    name,
  };
}

const ACTIVE_PARTICIPANT_STATUSES: VoiceParticipantStatus[] = [
  "invited",
  "ringing",
  "joined",
];

export async function getActiveCallForUser(
  userId: string,
): Promise<ActiveCallDetails | null> {
  const supabase = requireAdmin();

  const { data: participantRows, error } = await supabase
    .from("admin_voice_call_participants")
    .select("call_id, user_id, status, joined_at, left_at")
    .eq("user_id", userId)
    .in("status", ACTIVE_PARTICIPANT_STATUSES);

  if (error) throw new Error(error.message);
  if (!participantRows?.length) return null;

  const callIds = participantRows.map((p) => p.call_id);
  const { data: calls, error: callError } = await supabase
    .from("admin_voice_calls")
    .select("*")
    .in("id", callIds)
    .in("status", ["ringing", "active"])
    .order("created_at", { ascending: false })
    .limit(1);

  if (callError) throw new Error(callError.message);
  if (!calls?.length) return null;

  const call = mapCall(calls[0] as DbCall);
  const details = await getCallDetails(call.id);
  return details;
}

export async function getCallById(callId: string): Promise<VoiceCallRow | null> {
  const supabase = requireAdmin();
  const { data, error } = await supabase
    .from("admin_voice_calls")
    .select("*")
    .eq("id", callId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapCall(data as DbCall);
}

export async function getActiveCallInConversation(
  conversationId: string,
): Promise<VoiceCallRow | null> {
  const supabase = requireAdmin();
  const { data, error } = await supabase
    .from("admin_voice_calls")
    .select("*")
    .eq("conversation_id", conversationId)
    .in("status", ["ringing", "active"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapCall(data as DbCall);
}

export async function getCallDetails(
  callId: string,
): Promise<ActiveCallDetails | null> {
  const supabase = requireAdmin();
  const { data: call, error } = await supabase
    .from("admin_voice_calls")
    .select("*")
    .eq("id", callId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!call) return null;

  const { data: participants, error: pError } = await supabase
    .from("admin_voice_call_participants")
    .select(
      "call_id, user_id, status, joined_at, left_at, profile:admin_profiles(name)",
    )
    .eq("call_id", callId);

  if (pError) throw new Error(pError.message);

  const { data: conversation, error: cError } = await supabase
    .from("admin_conversations")
    .select("type, name, participant_low, participant_high")
    .eq("id", call.conversation_id)
    .maybeSingle();

  if (cError) throw new Error(cError.message);

  const memberIds =
    conversation?.type === "dm"
      ? [conversation.participant_low, conversation.participant_high].filter(
          Boolean,
        )
      : [];

  let conversationLabel = conversation?.name ?? "Conversation";
  if (conversation?.type === "dm" && memberIds.length === 2) {
    const { data: profiles } = await supabase
      .from("admin_profiles")
      .select("id, name")
      .in("id", memberIds as string[]);
    conversationLabel =
      profiles?.map((p) => p.name ?? "Staff").join(" & ") ?? conversationLabel;
  }

  const mappedParticipants = (participants ?? []).map((row) => {
    const profile = Array.isArray(row.profile) ? row.profile[0] : row.profile;
    return mapParticipant(
      row as DbParticipant,
      (profile as { name: string } | null)?.name ?? "Staff",
    );
  });

  return {
    ...mapCall(call as DbCall),
    participants: mappedParticipants,
    conversationLabel,
    isGroup: conversation?.type === "group",
  };
}

export async function userHasActiveCall(userId: string): Promise<boolean> {
  const active = await getActiveCallForUser(userId);
  return active !== null;
}

export async function countJoinedParticipants(callId: string): Promise<number> {
  const supabase = requireAdmin();
  const { count, error } = await supabase
    .from("admin_voice_call_participants")
    .select("*", { count: "exact", head: true })
    .eq("call_id", callId)
    .eq("status", "joined");

  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function createVoiceCall(
  conversationId: string,
  callerId: string,
  calleeIds: string[],
): Promise<ActiveCallDetails> {
  const supabase = requireAdmin();

  const member = await isMember(conversationId, callerId);
  if (!member) throw new Error("Not a member of this conversation.");

  const hasActive = await userHasActiveCall(callerId);
  if (hasActive) throw new Error("Pehle current call khatam karein.");

  const { data: call, error } = await supabase
    .from("admin_voice_calls")
    .insert({
      conversation_id: conversationId,
      initiated_by: callerId,
      status: "ringing",
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  const participantRows: {
    call_id: string;
    user_id: string;
    status: VoiceParticipantStatus;
    joined_at?: string;
  }[] = [
    {
      call_id: call.id,
      user_id: callerId,
      status: "joined",
      joined_at: new Date().toISOString(),
    },
    ...calleeIds.map((id) => ({
      call_id: call.id,
      user_id: id,
      status: "invited" as const,
    })),
  ];

  const { error: pError } = await supabase
    .from("admin_voice_call_participants")
    .insert(participantRows);

  if (pError) throw new Error(pError.message);

  const details = await getCallDetails(call.id);
  if (!details) throw new Error("Failed to load call details.");
  return details;
}

export async function updateParticipantStatus(
  callId: string,
  userId: string,
  status: VoiceParticipantStatus,
): Promise<void> {
  const supabase = requireAdmin();
  const patch: Record<string, string | null> = { status };
  if (status === "joined") patch.joined_at = new Date().toISOString();
  if (status === "left" || status === "declined" || status === "missed") {
    patch.left_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("admin_voice_call_participants")
    .update(patch)
    .eq("call_id", callId)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
}

export async function updateCallStatus(
  callId: string,
  status: VoiceCallStatus,
  extra?: { startedAt?: string; endedAt?: string },
): Promise<void> {
  const supabase = requireAdmin();
  const patch: Record<string, string> = { status };
  if (extra?.startedAt) patch.started_at = extra.startedAt;
  if (extra?.endedAt) patch.ended_at = extra.endedAt;

  const { error } = await supabase
    .from("admin_voice_calls")
    .update(patch)
    .eq("id", callId);

  if (error) throw new Error(error.message);
}

export async function markCallMissed(callId: string): Promise<void> {
  const supabase = requireAdmin();
  await updateCallStatus(callId, "missed", {
    endedAt: new Date().toISOString(),
  });

  await supabase
    .from("admin_voice_call_participants")
    .update({
      status: "missed",
      left_at: new Date().toISOString(),
    })
    .eq("call_id", callId)
    .in("status", ["invited", "ringing"]);
}

export async function endCallRows(callId: string): Promise<void> {
  const supabase = requireAdmin();
  await updateCallStatus(callId, "ended", {
    endedAt: new Date().toISOString(),
  });

  await supabase
    .from("admin_voice_call_participants")
    .update({
      status: "left",
      left_at: new Date().toISOString(),
    })
    .eq("call_id", callId)
    .in("status", ["invited", "ringing", "joined"]);
}

export async function joinGroupCallRows(
  callId: string,
  userId: string,
): Promise<void> {
  const joined = await countJoinedParticipants(callId);
  if (joined >= MAX_GROUP_CALL_PARTICIPANTS) {
    throw new Error("Call full — max 6 participants.");
  }

  const supabase = requireAdmin();
  const { error } = await supabase.from("admin_voice_call_participants").upsert(
    {
      call_id: callId,
      user_id: userId,
      status: "joined",
      joined_at: new Date().toISOString(),
    },
    { onConflict: "call_id,user_id" },
  );

  if (error) throw new Error(error.message);
}

export async function getConversationMemberIds(
  conversationId: string,
  excludeUserId?: string,
): Promise<string[]> {
  const supabase = requireAdmin();
  let query = supabase
    .from("admin_conversation_members")
    .select("user_id")
    .eq("conversation_id", conversationId);

  if (excludeUserId) {
    query = query.neq("user_id", excludeUserId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => r.user_id);
}

export async function getProfileName(userId: string): Promise<string> {
  const supabase = requireAdmin();
  const { data } = await supabase
    .from("admin_profiles")
    .select("name")
    .eq("id", userId)
    .maybeSingle();
  return data?.name ?? "Staff";
}
