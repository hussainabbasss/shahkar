"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { requirePermission } from "@/lib/admin/guards";
import {
  hasPermission,
  isSuperAdmin,
} from "@/lib/admin/permissions";
import {
  shouldSendAssignmentEmail,
  type IssueType,
  type TicketDepartment,
  type TicketEntitySnapshot,
  type TicketPriority,
  type TicketStatus,
} from "@/lib/admin/tickets";
import {
  assignTicket,
  buildTicketSnapshot,
  canUserShareTicket,
  countMyActiveTickets,
  countTicketChildren,
  createTicket,
  deleteTicket,
  getAssigneeReadState,
  getMyActiveTickets,
  getSharedTicketDetail,
  getStaffEmailAndName,
  getTicketByKey,
  getTicketChildren,
  listActiveStaffForAssignee,
  listEpicsAndStories,
  listTickets,
  listTicketsForBoard,
  markTicketViewed,
  resetAssigneeReadForNewAssignee,
  searchParentCandidates,
  searchOrdersForTicketLink,
  searchTicketsForPicker,
  updateAssigneeNotifiedAt,
  updateTicket,
  updateTicketStatus,
  type AdminTicket,
  type MyTicketSummary,
  type StaffOption,
  type TicketOrderLinkOption,
} from "@/lib/db/admin/tickets";
import {
  createTicketDepartment,
  getTicketDepartmentBySlug,
  listTicketDepartments,
  assertDepartmentExists,
  type TicketDepartmentRecord,
} from "@/lib/db/admin/ticket-departments";
import {
  createTicketComment,
  deleteTicketComment,
  getTicketCommentById,
  listTicketComments,
  type TicketComment,
} from "@/lib/db/admin/ticket-comments";
import {
  getAllowedChildTypes,
  MAX_TICKET_COMMENT_LENGTH,
  validateParentChild,
} from "@/lib/admin/tickets";
import { sendTicketAssignmentAlertEmail } from "@/lib/email/send-ticket-assignment-alert";

export type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

const MAX_TITLE = 200;
const MAX_DESCRIPTION = 8000;

async function notifyAssignee(ticket: AdminTicket, isNewAssignee: boolean) {
  if (!ticket.assigneeId) return;

  try {
    if (!isNewAssignee) return;

    const { lastNotifiedAt, lastViewedAt } = await getAssigneeReadState(
      ticket.id,
      ticket.assigneeId,
    );

    if (!shouldSendAssignmentEmail(lastNotifiedAt, lastViewedAt)) return;

    const staff = await getStaffEmailAndName(ticket.assigneeId);
    if (!staff) return;

    const dept = await getTicketDepartmentBySlug(ticket.department);

    await sendTicketAssignmentAlertEmail({
      to: staff.email,
      assigneeName: staff.name,
      ticketKey: ticket.ticketKey,
      title: ticket.title,
      departmentName: dept?.name ?? ticket.department,
      issueType: ticket.issueType,
      priority: ticket.priority,
      reporterName: ticket.reporterName,
    });

    await updateAssigneeNotifiedAt(ticket.id, ticket.assigneeId);
  } catch (err) {
    console.error("[email] ticket assignment alert failed:", err);
  }
}

export async function createTicketAction(input: {
  issueType: IssueType;
  department: TicketDepartment;
  parentId: string | null;
  title: string;
  description: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  assigneeId: string | null;
  dueDate: string | null;
  linkedOrderId?: string | null;
}): Promise<ActionResult<AdminTicket>> {
  try {
    const user = await requirePermission("manage_tickets");

    const title = input.title.trim();
    if (!title || title.length < 2) {
      return { success: false, error: "Title must be at least 2 characters." };
    }
    if (title.length > MAX_TITLE) {
      return { success: false, error: "Title too long (max 200)." };
    }
    if (input.description && input.description.length > MAX_DESCRIPTION) {
      return { success: false, error: "Description too long (max 8000)." };
    }

    await assertDepartmentExists(input.department);

    const ticket = await createTicket({
      issueType: input.issueType,
      department: input.department,
      parentId: input.parentId,
      title,
      description: input.description?.trim() || null,
      status: input.status,
      priority: input.priority,
      assigneeId: input.assigneeId,
      reporterId: user.id,
      dueDate: input.dueDate,
      linkedOrderId: input.linkedOrderId ?? null,
    });

    if (ticket.assigneeId) {
      await resetAssigneeReadForNewAssignee(ticket.id, ticket.assigneeId);
      void notifyAssignee(ticket, true);
    }

    revalidatePath("/admin/tickets");
    revalidatePath("/admin/dashboard");
    return { success: true, data: ticket };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function updateTicketAction(input: {
  ticketKey: string;
  title?: string;
  description?: string | null;
  department?: TicketDepartment;
  parentId?: string | null;
  priority?: TicketPriority;
  dueDate?: string | null;
  linkedOrderId?: string | null;
}): Promise<ActionResult<AdminTicket>> {
  try {
    await requirePermission("manage_tickets");
    const existing = await getTicketByKey(input.ticketKey);
    if (!existing) return { success: false, error: "Ticket not found." };

    if (input.title !== undefined) {
      const title = input.title.trim();
      if (!title || title.length < 2) {
        return { success: false, error: "Title must be at least 2 characters." };
      }
      if (title.length > MAX_TITLE) {
        return { success: false, error: "Title too long (max 200)." };
      }
    }

    if (input.department !== undefined) {
      await assertDepartmentExists(input.department);
    }

    const ticket = await updateTicket(existing.id, {
      title: input.title?.trim(),
      description: input.description,
      department: input.department,
      parentId: input.parentId,
      priority: input.priority,
      dueDate: input.dueDate,
      linkedOrderId: input.linkedOrderId,
    });

    revalidatePath("/admin/tickets");
    revalidatePath(`/admin/tickets/${ticket.ticketKey}`);
    return { success: true, data: ticket };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function updateTicketStatusAction(
  ticketKey: string,
  status: TicketStatus,
): Promise<ActionResult<AdminTicket>> {
  try {
    await requirePermission("manage_tickets");
    const existing = await getTicketByKey(ticketKey);
    if (!existing) return { success: false, error: "Ticket not found." };

    const ticket = await updateTicketStatus(existing.id, status);
    revalidatePath("/admin/tickets");
    revalidatePath(`/admin/tickets/${ticketKey}`);
    revalidatePath("/admin/dashboard");
    return { success: true, data: ticket };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function assignTicketAction(
  ticketKey: string,
  assigneeId: string | null,
): Promise<ActionResult<AdminTicket>> {
  try {
    await requirePermission("manage_tickets");
    const existing = await getTicketByKey(ticketKey);
    if (!existing) return { success: false, error: "Ticket not found." };

    const isNewAssignee =
      assigneeId !== null && assigneeId !== existing.assigneeId;

    if (isNewAssignee && assigneeId) {
      await resetAssigneeReadForNewAssignee(existing.id, assigneeId);
    }

    const ticket = await assignTicket(existing.id, assigneeId);

    if (isNewAssignee) {
      void notifyAssignee(ticket, true);
    }

    revalidatePath("/admin/tickets");
    revalidatePath(`/admin/tickets/${ticketKey}`);
    revalidatePath("/admin/dashboard");
    return { success: true, data: ticket };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function deleteTicketAction(
  ticketKey: string,
): Promise<ActionResult> {
  try {
    const user = await requirePermission("manage_tickets");
    const existing = await getTicketByKey(ticketKey);
    if (!existing) return { success: false, error: "Ticket not found." };

    if (
      !isSuperAdmin(user) &&
      existing.reporterId !== user.id
    ) {
      return {
        success: false,
        error: "You can only delete tickets you created.",
      };
    }

    const childCount = await countTicketChildren(existing.id);
    if (childCount > 0) {
      // v1: hard delete orphans children via ON DELETE SET NULL
    }

    await deleteTicket(existing.id);
    revalidatePath("/admin/tickets");
    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function fetchTicketByKeyAction(
  ticketKey: string,
): Promise<AdminTicket | null> {
  await requirePermission("view_tickets");
  return getTicketByKey(ticketKey);
}

export async function fetchTicketChildrenAction(
  ticketKey: string,
): Promise<AdminTicket[]> {
  await requirePermission("view_tickets");
  const ticket = await getTicketByKey(ticketKey);
  if (!ticket) return [];
  return getTicketChildren(ticket.id);
}

export async function listTicketsForBoardAction(filters: {
  department?: TicketDepartment | null;
  epicId?: string | null;
  storyId?: string | null;
}): Promise<AdminTicket[]> {
  await requirePermission("view_tickets");
  return listTicketsForBoard(filters);
}

export async function listAllTicketsAction(filters: {
  department?: TicketDepartment | null;
  epicId?: string | null;
  storyId?: string | null;
  includeBacklog?: boolean;
}): Promise<AdminTicket[]> {
  await requirePermission("view_tickets");
  return listTickets({
    ...filters,
    includeBacklog: filters.includeBacklog,
  });
}

export async function searchTicketsAction(
  query: string,
): Promise<TicketEntitySnapshot[]> {
  await requirePermission("view_tickets");
  return searchTicketsForPicker(query);
}

export async function searchParentCandidatesAction(
  issueType: IssueType,
  query: string,
): Promise<AdminTicket[]> {
  await requirePermission("view_tickets");
  return searchParentCandidates(issueType, query);
}

export async function searchOrdersForTicketLinkAction(
  query: string,
): Promise<TicketOrderLinkOption[]> {
  await requirePermission("manage_tickets");
  return searchOrdersForTicketLink(query);
}

export async function fetchEpicsAndStoriesAction(): Promise<AdminTicket[]> {
  await requirePermission("view_tickets");
  return listEpicsAndStories();
}

export async function fetchStaffForAssigneeAction(): Promise<StaffOption[]> {
  await requirePermission("view_tickets");
  return listActiveStaffForAssignee();
}

export async function fetchSharedTicketAction(ticketId: string): Promise<{
  ticket: AdminTicket | null;
  snapshotOnly: boolean;
}> {
  const user = await requireAdmin();
  if (!hasPermission(user, "view_tickets")) {
    return { ticket: null, snapshotOnly: true };
  }
  const ticket = await getSharedTicketDetail(ticketId);
  return { ticket, snapshotOnly: false };
}

export async function markTicketViewedAction(
  ticketKey: string,
): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    const ticket = await getTicketByKey(ticketKey);
    if (!ticket) return { success: false, error: "Ticket not found." };

    if (
      ticket.assigneeId === user.id ||
      hasPermission(user, "view_tickets")
    ) {
      await markTicketViewed(ticket.id, user.id);
    }
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function fetchMyTicketsAction(): Promise<MyTicketSummary[]> {
  const user = await requirePermission("view_tickets");
  return getMyActiveTickets(user.id);
}

export async function fetchMyTicketCountAction(): Promise<number> {
  const user = await requireAdmin();
  if (!hasPermission(user, "view_tickets")) return 0;
  return countMyActiveTickets(user.id);
}

export async function canShareTicketsAction(
  ticketIds: string[],
): Promise<boolean> {
  const user = await requireAdmin();
  if (!hasPermission(user, "view_tickets")) return false;
  const hasManage = hasPermission(user, "manage_tickets");

  for (const id of ticketIds) {
    const ok = await canUserShareTicket(id, user.id, hasManage);
    if (!ok) return false;
  }
  return true;
}

export async function buildTicketSnapshotsAction(
  ticketIds: string[],
): Promise<TicketEntitySnapshot[]> {
  const user = await requireAdmin();
  const hasManage = hasPermission(user, "manage_tickets");
  const snapshots: TicketEntitySnapshot[] = [];

  for (const id of ticketIds) {
    const canShare = await canUserShareTicket(id, user.id, hasManage);
    if (!canShare) throw new Error("Cannot share this ticket.");

    const ticket = await getSharedTicketDetail(id);
    if (!ticket) throw new Error("Ticket not found.");
    snapshots.push(await buildTicketSnapshot(ticket));
  }

  return snapshots;
}

export async function assignToMeAction(
  ticketKey: string,
): Promise<ActionResult<AdminTicket>> {
  try {
    const user = await requirePermission("manage_tickets");
    return assignTicketAction(ticketKey, user.id);
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function listTicketDepartmentsAction(): Promise<
  TicketDepartmentRecord[]
> {
  await requirePermission("view_tickets");
  return listTicketDepartments();
}

export async function createTicketDepartmentAction(
  name: string,
): Promise<ActionResult<TicketDepartmentRecord>> {
  try {
    await requirePermission("manage_tickets");
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      return {
        success: false,
        error: "Department name must be at least 2 characters.",
      };
    }
    const dept = await createTicketDepartment({ name: trimmed });
    revalidatePath("/admin/tickets");
    revalidatePath("/admin/tickets/new");
    return { success: true, data: dept };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function fetchTicketCommentsAction(
  ticketKey: string,
): Promise<TicketComment[]> {
  await requirePermission("view_tickets");
  const ticket = await getTicketByKey(ticketKey);
  if (!ticket) return [];
  return listTicketComments(ticket.id);
}

export async function addTicketCommentAction(
  ticketKey: string,
  body: string,
): Promise<ActionResult<TicketComment>> {
  try {
    const user = await requirePermission("view_tickets");
    const ticket = await getTicketByKey(ticketKey);
    if (!ticket) return { success: false, error: "Ticket not found." };

    const text = body.trim();
    if (!text) return { success: false, error: "Comment cannot be empty." };
    if (text.length > MAX_TICKET_COMMENT_LENGTH) {
      return { success: false, error: "Comment too long (max 2000)." };
    }

    const comment = await createTicketComment({
      ticketId: ticket.id,
      authorId: user.id,
      body: text,
    });

    revalidatePath(`/admin/tickets/${ticketKey}`);
    return { success: true, data: comment };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function deleteTicketCommentAction(
  ticketKey: string,
  commentId: string,
): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    if (!hasPermission(user, "view_tickets")) {
      return { success: false, error: "Permission denied." };
    }

    const ticket = await getTicketByKey(ticketKey);
    if (!ticket) return { success: false, error: "Ticket not found." };

    const comment = await getTicketCommentById(commentId);
    if (!comment || comment.ticketId !== ticket.id) {
      return { success: false, error: "Comment not found." };
    }

    if (
      comment.authorId !== user.id &&
      !hasPermission(user, "manage_tickets") &&
      !isSuperAdmin(user)
    ) {
      return { success: false, error: "Cannot delete this comment." };
    }

    await deleteTicketComment(commentId, ticket.id);
    revalidatePath(`/admin/tickets/${ticketKey}`);
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function createQuickChildTicketAction(input: {
  parentTicketKey: string;
  issueType: IssueType;
  title: string;
}): Promise<ActionResult<AdminTicket>> {
  try {
    const user = await requirePermission("manage_tickets");
    const parent = await getTicketByKey(input.parentTicketKey);
    if (!parent) return { success: false, error: "Parent ticket not found." };

    const allowed = getAllowedChildTypes(parent.issueType);
    if (!allowed.includes(input.issueType)) {
      return {
        success: false,
        error: `Cannot add ${input.issueType} under ${parent.issueType}.`,
      };
    }

    const title = input.title.trim();
    if (title.length < 2) {
      return { success: false, error: "Title must be at least 2 characters." };
    }

    const hierarchyError = validateParentChild(
      input.issueType,
      parent.issueType,
    );
    if (hierarchyError) {
      return { success: false, error: hierarchyError };
    }

    const ticket = await createTicket({
      issueType: input.issueType,
      department: parent.department,
      parentId: parent.id,
      title,
      description: null,
      status: "todo",
      priority: "medium",
      assigneeId: null,
      reporterId: user.id,
      dueDate: null,
    });

    revalidatePath("/admin/tickets");
    revalidatePath(`/admin/tickets/${input.parentTicketKey}`);
    revalidatePath(`/admin/tickets/${ticket.ticketKey}`);
    return { success: true, data: ticket };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}
