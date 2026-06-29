"use client";

import { useEffect } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export function useMessagesRealtime(
  conversationId: string | null,
  onInsert: () => void,
  onUpdate: () => void,
) {
  useEffect(() => {
    if (!conversationId) return;

    const supabase = createBrowserSupabaseClient();
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "admin_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => onInsert(),
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "admin_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => onUpdate(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [conversationId, onInsert, onUpdate]);
}
