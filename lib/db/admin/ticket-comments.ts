import { createAdminClient } from "@/lib/supabase/admin";

function requireAdmin() {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Supabase not configured");
  return supabase;
}

export type TicketComment = {
  id: string;
  ticketId: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
  updatedAt: string;
};

type DbComment = {
  id: string;
  ticket_id: string;
  author_id: string;
  body: string;
  created_at: string;
  updated_at: string;
  author?: { name: string } | { name: string }[] | null;
};

function mapComment(row: DbComment): TicketComment {
  const author = Array.isArray(row.author) ? row.author[0] : row.author;
  return {
    id: row.id,
    ticketId: row.ticket_id,
    authorId: row.author_id,
    authorName: author?.name ?? "Staff",
    body: row.body,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listTicketComments(
  ticketId: string,
): Promise<TicketComment[]> {
  const supabase = requireAdmin();
  const { data, error } = await supabase
    .from("admin_ticket_comments")
    .select(
      "*, author:admin_profiles!admin_ticket_comments_author_id_fkey(name)",
    )
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data as DbComment[]).map(mapComment);
}

export async function createTicketComment(opts: {
  ticketId: string;
  authorId: string;
  body: string;
}): Promise<TicketComment> {
  const supabase = requireAdmin();
  const body = opts.body.trim();
  const { data, error } = await supabase
    .from("admin_ticket_comments")
    .insert({
      ticket_id: opts.ticketId,
      author_id: opts.authorId,
      body,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  const comments = await listTicketComments(opts.ticketId);
  const created = comments.find((c) => c.id === data.id);
  if (!created) throw new Error("Failed to load comment.");
  return created;
}

export async function deleteTicketComment(
  commentId: string,
  ticketId: string,
): Promise<void> {
  const supabase = requireAdmin();
  const { error } = await supabase
    .from("admin_ticket_comments")
    .delete()
    .eq("id", commentId)
    .eq("ticket_id", ticketId);
  if (error) throw new Error(error.message);
}

export async function getTicketCommentById(
  commentId: string,
): Promise<TicketComment | null> {
  const supabase = requireAdmin();
  const { data, error } = await supabase
    .from("admin_ticket_comments")
    .select(
      "*, author:admin_profiles!admin_ticket_comments_author_id_fkey(name)",
    )
    .eq("id", commentId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapComment(data as DbComment);
}
