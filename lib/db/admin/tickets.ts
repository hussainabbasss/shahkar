import {
  formatTicketKey,
  isBoardIssueType,
  parseTicketKey,
  validateParentChild,
  type IssueType,
  type TicketDepartment,
  type TicketEntitySnapshot,
  type TicketPriority,
  type TicketStatus,
} from "@/lib/admin/tickets";
import { getTicketDepartmentBySlug } from "@/lib/db/admin/ticket-departments";
import { createAdminClient } from "@/lib/supabase/admin";

function requireAdmin() {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Supabase not configured");
  return supabase;
}

type DbTicket = {
  id: string;
  ticket_number: number;
  issue_type: IssueType;
  department: TicketDepartment;
  parent_id: string | null;
  title: string;
  description: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  assignee_id: string | null;
  reporter_id: string;
  due_date: string | null;
  linked_order_id: string | null;
  linked_product_id: string | null;
  automation_key: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  assignee?: { name: string } | { name: string }[] | null;
  reporter?: { name: string } | { name: string }[] | null;
};

export type LinkedOrderSummary = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  city: string;
  total: number;
  status: string;
  source: string;
};

export type LinkedProductSummary = {
  id: string;
  name: string;
  slug: string;
  stock: number;
  image: string;
};

type ParentSummary = {
  ticket_number: number;
  title: string;
  issue_type: IssueType;
};

export type AdminTicket = {
  id: string;
  ticketNumber: number;
  ticketKey: string;
  issueType: IssueType;
  department: TicketDepartment;
  parentId: string | null;
  parentKey: string | null;
  parentTitle: string | null;
  title: string;
  description: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  assigneeId: string | null;
  assigneeName: string | null;
  reporterId: string;
  reporterName: string;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  linkedOrderId: string | null;
  linkedProductId: string | null;
  automationKey: string | null;
  linkedOrder: LinkedOrderSummary | null;
  linkedProduct: LinkedProductSummary | null;
  childCount?: number;
};

export type MyTicketSummary = {
  id: string;
  ticketKey: string;
  title: string;
  priority: TicketPriority;
  status: TicketStatus;
  department: TicketDepartment;
  updatedAt: string;
};

export type StaffOption = {
  id: string;
  name: string;
  email: string;
};

function relName(
  rel: { name: string } | { name: string }[] | null | undefined,
): string {
  if (!rel) return "";
  if (Array.isArray(rel)) return rel[0]?.name ?? "";
  return rel.name;
}

function mapTicket(
  row: DbTicket,
  parent?: ParentSummary | null,
  links?: {
    linkedOrder: LinkedOrderSummary | null;
    linkedProduct: LinkedProductSummary | null;
  },
): AdminTicket {
  return {
    id: row.id,
    ticketNumber: row.ticket_number,
    ticketKey: formatTicketKey(row.ticket_number),
    issueType: row.issue_type,
    department: row.department,
    parentId: row.parent_id,
    parentKey: parent ? formatTicketKey(parent.ticket_number) : null,
    parentTitle: parent?.title ?? null,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    assigneeId: row.assignee_id,
    assigneeName: row.assignee_id ? relName(row.assignee) || null : null,
    reporterId: row.reporter_id,
    reporterName: relName(row.reporter),
    dueDate: row.due_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at,
    linkedOrderId: row.linked_order_id ?? null,
    linkedProductId: row.linked_product_id ?? null,
    automationKey: row.automation_key ?? null,
    linkedOrder: links?.linkedOrder ?? null,
    linkedProduct: links?.linkedProduct ?? null,
  };
}

const TICKET_SELECT = `
  *,
  assignee:admin_profiles!admin_tickets_assignee_id_fkey(name),
  reporter:admin_profiles!admin_tickets_reporter_id_fkey(name)
`;

async function loadParentSummaries(
  parentIds: string[],
): Promise<Map<string, ParentSummary>> {
  const unique = [...new Set(parentIds)];
  if (!unique.length) return new Map();

  const supabase = requireAdmin();
  const { data, error } = await supabase
    .from("admin_tickets")
    .select("id, ticket_number, title, issue_type")
    .in("id", unique);
  if (error) throw new Error(error.message);

  const map = new Map<string, ParentSummary>();
  for (const row of data ?? []) {
    map.set(row.id as string, {
      ticket_number: row.ticket_number as number,
      title: row.title as string,
      issue_type: row.issue_type as IssueType,
    });
  }
  return map;
}

async function loadLinkedEntities(ticket: DbTicket): Promise<{
  linkedOrder: LinkedOrderSummary | null;
  linkedProduct: LinkedProductSummary | null;
}> {
  const supabase = requireAdmin();
  let linkedOrder: LinkedOrderSummary | null = null;
  let linkedProduct: LinkedProductSummary | null = null;

  if (ticket.linked_order_id) {
    const { data } = await supabase
      .from("orders")
      .select(
        "id, order_number, customer_name, customer_phone, city, total, status, source",
      )
      .eq("id", ticket.linked_order_id)
      .maybeSingle();
    if (data) {
      linkedOrder = {
        id: data.id as string,
        orderNumber: data.order_number as string,
        customerName: data.customer_name as string,
        customerPhone: data.customer_phone as string,
        city: data.city as string,
        total: Number(data.total),
        status: data.status as string,
        source: (data.source as string) ?? "storefront",
      };
    }
  }

  if (ticket.linked_product_id) {
    const { data } = await supabase
      .from("products")
      .select("id, name, slug, stock, images")
      .eq("id", ticket.linked_product_id)
      .maybeSingle();
    if (data) {
      const images = data.images as string[] | null;
      linkedProduct = {
        id: data.id as string,
        name: data.name as string,
        slug: data.slug as string,
        stock: Number(data.stock),
        image: images?.[0] ?? "",
      };
    }
  }

  return { linkedOrder, linkedProduct };
}

async function mapTicketRows(rows: DbTicket[]): Promise<AdminTicket[]> {
  const parentIds = rows
    .map((r) => r.parent_id)
    .filter((id): id is string => !!id);
  const parents = await loadParentSummaries(parentIds);
  return rows.map((row) =>
    mapTicket(row, row.parent_id ? parents.get(row.parent_id) : null),
  );
}

async function mapTicketRow(
  row: DbTicket,
  withLinks = false,
): Promise<AdminTicket> {
  const parent = row.parent_id
    ? (await loadParentSummaries([row.parent_id])).get(row.parent_id) ?? null
    : null;
  const links = withLinks ? await loadLinkedEntities(row) : undefined;
  return mapTicket(row, parent, links);
}

export async function getTicketById(id: string): Promise<AdminTicket | null> {
  const supabase = requireAdmin();
  const { data, error } = await supabase
    .from("admin_tickets")
    .select(TICKET_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapTicketRow(data as DbTicket, true);
}

export async function getTicketByKey(
  ticketKey: string,
): Promise<AdminTicket | null> {
  const num = parseTicketKey(ticketKey);
  if (num === null) return null;
  const supabase = requireAdmin();
  const { data, error } = await supabase
    .from("admin_tickets")
    .select(TICKET_SELECT)
    .eq("ticket_number", num)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapTicketRow(data as DbTicket, true);
}

export async function getTicketChildren(
  parentId: string,
): Promise<AdminTicket[]> {
  const supabase = requireAdmin();
  const { data, error } = await supabase
    .from("admin_tickets")
    .select(TICKET_SELECT)
    .eq("parent_id", parentId)
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return mapTicketRows(data as DbTicket[]);
}

export type TicketTaskNode = {
  task: AdminTicket;
  subtasks: AdminTicket[];
};

/** Story detail: tasks with nested sub-tasks */
export async function getStoryTaskTree(
  storyId: string,
): Promise<TicketTaskNode[]> {
  const children = await getTicketChildren(storyId);
  const tasks = children.filter((c) => c.issueType === "task");
  return Promise.all(
    tasks.map(async (task) => {
      const subtasks = (await getTicketChildren(task.id)).filter(
        (c) => c.issueType === "subtask",
      );
      return { task, subtasks };
    }),
  );
}

export async function countTicketChildren(parentId: string): Promise<number> {
  const supabase = requireAdmin();
  const { count, error } = await supabase
    .from("admin_tickets")
    .select("id", { count: "exact", head: true })
    .eq("parent_id", parentId);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

async function getParentType(parentId: string | null): Promise<IssueType | null> {
  if (!parentId) return null;
  const supabase = requireAdmin();
  const { data } = await supabase
    .from("admin_tickets")
    .select("issue_type")
    .eq("id", parentId)
    .maybeSingle();
  return (data?.issue_type as IssueType) ?? null;
}

export async function validateTicketHierarchy(
  issueType: IssueType,
  parentId: string | null,
  ticketId?: string,
): Promise<string | null> {
  if (ticketId && parentId === ticketId) {
    return "Ticket cannot be its own parent.";
  }
  const parentType = await getParentType(parentId);
  return validateParentChild(issueType, parentType);
}

export type CreateTicketInput = {
  issueType: IssueType;
  department: TicketDepartment;
  parentId: string | null;
  title: string;
  description: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  assigneeId: string | null;
  reporterId: string;
  dueDate: string | null;
  linkedOrderId?: string | null;
  linkedProductId?: string | null;
  automationKey?: string | null;
};

export async function createTicket(
  input: CreateTicketInput,
): Promise<AdminTicket> {
  const hierarchyError = await validateTicketHierarchy(
    input.issueType,
    input.parentId,
  );
  if (hierarchyError) throw new Error(hierarchyError);

  const supabase = requireAdmin();
  const { data, error } = await supabase
    .from("admin_tickets")
    .insert({
      issue_type: input.issueType,
      department: input.department,
      parent_id: input.parentId,
      title: input.title.trim(),
      description: input.description,
      status: input.status,
      priority: input.priority,
      assignee_id: input.assigneeId,
      reporter_id: input.reporterId,
      due_date: input.dueDate,
      linked_order_id: input.linkedOrderId ?? null,
      linked_product_id: input.linkedProductId ?? null,
      automation_key: input.automationKey ?? null,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  const ticket = await getTicketById(data.id);
  if (!ticket) throw new Error("Failed to load created ticket.");
  return ticket;
}

export type UpdateTicketInput = {
  title?: string;
  description?: string | null;
  department?: TicketDepartment;
  parentId?: string | null;
  priority?: TicketPriority;
  dueDate?: string | null;
  linkedOrderId?: string | null;
};

export async function updateTicket(
  id: string,
  input: UpdateTicketInput,
): Promise<AdminTicket> {
  const existing = await getTicketById(id);
  if (!existing) throw new Error("Ticket not found.");

  const parentId =
    input.parentId !== undefined ? input.parentId : existing.parentId;
  const hierarchyError = await validateTicketHierarchy(
    existing.issueType,
    parentId,
    id,
  );
  if (hierarchyError) throw new Error(hierarchyError);

  const supabase = requireAdmin();
  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (input.title !== undefined) patch.title = input.title.trim();
  if (input.description !== undefined) patch.description = input.description;
  if (input.department !== undefined) patch.department = input.department;
  if (input.parentId !== undefined) patch.parent_id = input.parentId;
  if (input.priority !== undefined) patch.priority = input.priority;
  if (input.dueDate !== undefined) patch.due_date = input.dueDate;
  if (input.linkedOrderId !== undefined) {
    patch.linked_order_id = input.linkedOrderId;
  }

  const { error } = await supabase
    .from("admin_tickets")
    .update(patch)
    .eq("id", id);
  if (error) throw new Error(error.message);

  const ticket = await getTicketById(id);
  if (!ticket) throw new Error("Ticket not found.");
  return ticket;
}

export async function updateTicketStatus(
  id: string,
  status: TicketStatus,
): Promise<AdminTicket> {
  const supabase = requireAdmin();
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = {
    status,
    updated_at: now,
  };
  if (status === "done") {
    patch.completed_at = now;
  } else {
    patch.completed_at = null;
  }

  const { error } = await supabase
    .from("admin_tickets")
    .update(patch)
    .eq("id", id);
  if (error) throw new Error(error.message);

  const ticket = await getTicketById(id);
  if (!ticket) throw new Error("Ticket not found.");
  return ticket;
}

export async function assignTicket(
  id: string,
  assigneeId: string | null,
): Promise<AdminTicket> {
  const supabase = requireAdmin();
  const { error } = await supabase
    .from("admin_tickets")
    .update({
      assignee_id: assigneeId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);

  const ticket = await getTicketById(id);
  if (!ticket) throw new Error("Ticket not found.");
  return ticket;
}

export async function deleteTicket(id: string): Promise<void> {
  const supabase = requireAdmin();
  const { error } = await supabase.from("admin_tickets").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export type ListTicketsFilters = {
  department?: TicketDepartment | null;
  epicId?: string | null;
  storyId?: string | null;
  statuses?: TicketStatus[];
  boardOnly?: boolean;
  includeBacklog?: boolean;
};

async function collectDescendantIds(rootId: string): Promise<Set<string>> {
  const supabase = requireAdmin();
  const ids = new Set<string>([rootId]);
  let frontier = [rootId];

  while (frontier.length) {
    const { data } = await supabase
      .from("admin_tickets")
      .select("id")
      .in("parent_id", frontier);
    const children = (data ?? []).map((r) => r.id as string);
    frontier = children.filter((id) => !ids.has(id));
    for (const id of frontier) ids.add(id);
  }

  return ids;
}

export async function listTickets(
  filters: ListTicketsFilters = {},
): Promise<AdminTicket[]> {
  const supabase = requireAdmin();
  let query = supabase
    .from("admin_tickets")
    .select(TICKET_SELECT)
    .order("updated_at", { ascending: false });

  if (filters.department) {
    query = query.eq("department", filters.department);
  }

  if (filters.statuses?.length) {
    query = query.in("status", filters.statuses);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  let tickets = await mapTicketRows((data as DbTicket[]) ?? []);

  if (filters.boardOnly) {
    tickets = tickets.filter((t) => isBoardIssueType(t.issueType));
    if (!filters.includeBacklog) {
      tickets = tickets.filter(
        (t) => t.status !== "backlog" && t.status !== "cancelled",
      );
    }
  }

  if (filters.storyId) {
    const subtree = await collectDescendantIds(filters.storyId);
    tickets = tickets.filter((t) => subtree.has(t.id));
  } else if (filters.epicId) {
    const subtree = await collectDescendantIds(filters.epicId);
    tickets = tickets.filter((t) => subtree.has(t.id));
  }

  return tickets;
}

export async function listTicketsForBoard(
  filters: ListTicketsFilters = {},
): Promise<AdminTicket[]> {
  return listTickets({
    ...filters,
    boardOnly: true,
    statuses: filters.statuses ?? ["todo", "in_progress", "done"],
  });
}

export async function listEpicsAndStories(): Promise<AdminTicket[]> {
  const supabase = requireAdmin();
  const { data, error } = await supabase
    .from("admin_tickets")
    .select(TICKET_SELECT)
    .in("issue_type", ["epic", "story"])
    .order("title");
  if (error) throw new Error(error.message);
  return mapTicketRows((data as DbTicket[]) ?? []);
}

export async function searchParentCandidates(
  issueType: IssueType,
  query: string,
): Promise<AdminTicket[]> {
  const allowedTypes: IssueType[] =
    issueType === "story"
      ? ["epic"]
      : issueType === "task"
        ? ["epic", "story"]
        : issueType === "subtask"
          ? ["task"]
          : [];

  if (!allowedTypes.length) return [];

  const supabase = requireAdmin();
  let dbQuery = supabase
    .from("admin_tickets")
    .select(TICKET_SELECT)
    .in("issue_type", allowedTypes)
    .order("title")
    .limit(30);

  if (query.trim()) {
    const term = query.trim();
    dbQuery = dbQuery.or(`title.ilike.%${term}%`);
  }

  const { data, error } = await dbQuery;
  if (error) throw new Error(error.message);
  return mapTicketRows((data as DbTicket[]) ?? []);
}

export async function searchTicketsForPicker(
  query: string,
): Promise<TicketEntitySnapshot[]> {
  const supabase = requireAdmin();
  let dbQuery = supabase
    .from("admin_tickets")
    .select(TICKET_SELECT)
    .order("updated_at", { ascending: false })
    .limit(20);

  if (query.trim()) {
    const term = query.trim();
    const num = parseTicketKey(term);
    if (num !== null) {
      dbQuery = dbQuery.eq("ticket_number", num);
    } else {
      dbQuery = dbQuery.or(`title.ilike.%${term}%`);
    }
  }

  const { data, error } = await dbQuery;
  if (error) throw new Error(error.message);

  const tickets = await mapTicketRows((data as DbTicket[]) ?? []);
  return Promise.all(tickets.map((ticket) => buildTicketSnapshot(ticket)));
}

export async function buildTicketSnapshot(
  ticket: AdminTicket,
): Promise<TicketEntitySnapshot> {
  const dept = await getTicketDepartmentBySlug(ticket.department);
  return {
    id: ticket.id,
    ticketKey: ticket.ticketKey,
    issueType: ticket.issueType,
    department: ticket.department,
    departmentName: dept?.name ?? ticket.department,
    title: ticket.title,
    status: ticket.status,
    priority: ticket.priority,
    assigneeName: ticket.assigneeName,
    parentKey: ticket.parentKey,
    parentTitle: ticket.parentTitle,
  };
}

export async function getSharedTicketDetail(
  ticketId: string,
): Promise<AdminTicket | null> {
  return getTicketById(ticketId);
}

export async function listActiveStaffForAssignee(): Promise<StaffOption[]> {
  const supabase = requireAdmin();
  const { data, error } = await supabase
    .from("admin_profiles")
    .select("id, name, email")
    .eq("active", true)
    .order("name");
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({
    id: r.id as string,
    name: r.name as string,
    email: r.email as string,
  }));
}

export async function getMyActiveTickets(
  userId: string,
  limit = 5,
): Promise<MyTicketSummary[]> {
  const supabase = requireAdmin();
  const { data, error } = await supabase
    .from("admin_tickets")
    .select("id, ticket_number, title, priority, status, department, updated_at")
    .eq("assignee_id", userId)
    .in("status", ["todo", "in_progress"])
    .order("priority", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);

  const priorityOrder: Record<TicketPriority, number> = {
    urgent: 4,
    high: 3,
    medium: 2,
    low: 1,
  };

  const sorted = [...(data ?? [])].sort((a, b) => {
    const pa = priorityOrder[a.priority as TicketPriority] ?? 0;
    const pb = priorityOrder[b.priority as TicketPriority] ?? 0;
    if (pb !== pa) return pb - pa;
    return (
      new Date(b.updated_at as string).getTime() -
      new Date(a.updated_at as string).getTime()
    );
  });

  return sorted.slice(0, limit).map((row) => ({
    id: row.id as string,
    ticketKey: formatTicketKey(row.ticket_number as number),
    title: row.title as string,
    priority: row.priority as TicketPriority,
    status: row.status as TicketStatus,
    department: row.department as TicketDepartment,
    updatedAt: row.updated_at as string,
  }));
}

export async function countMyActiveTickets(userId: string): Promise<number> {
  const supabase = requireAdmin();
  const { count, error } = await supabase
    .from("admin_tickets")
    .select("id", { count: "exact", head: true })
    .eq("assignee_id", userId)
    .in("status", ["todo", "in_progress"]);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function getAssigneeReadState(
  ticketId: string,
  userId: string,
): Promise<{ lastNotifiedAt: string | null; lastViewedAt: string | null }> {
  const supabase = requireAdmin();
  const { data } = await supabase
    .from("admin_ticket_assignee_reads")
    .select("last_notified_at, last_viewed_at")
    .eq("ticket_id", ticketId)
    .eq("user_id", userId)
    .maybeSingle();

  return {
    lastNotifiedAt: data?.last_notified_at ?? null,
    lastViewedAt: data?.last_viewed_at ?? null,
  };
}

export async function updateAssigneeNotifiedAt(
  ticketId: string,
  userId: string,
): Promise<void> {
  const supabase = requireAdmin();
  const now = new Date().toISOString();
  const { data: existing } = await supabase
    .from("admin_ticket_assignee_reads")
    .select("last_viewed_at")
    .eq("ticket_id", ticketId)
    .eq("user_id", userId)
    .maybeSingle();

  await supabase.from("admin_ticket_assignee_reads").upsert(
    {
      ticket_id: ticketId,
      user_id: userId,
      last_notified_at: now,
      last_viewed_at: existing?.last_viewed_at ?? null,
    },
    { onConflict: "ticket_id,user_id" },
  );
}

export async function markTicketViewed(
  ticketId: string,
  userId: string,
): Promise<void> {
  const supabase = requireAdmin();
  const now = new Date().toISOString();
  const { data: existing } = await supabase
    .from("admin_ticket_assignee_reads")
    .select("last_notified_at")
    .eq("ticket_id", ticketId)
    .eq("user_id", userId)
    .maybeSingle();

  await supabase.from("admin_ticket_assignee_reads").upsert(
    {
      ticket_id: ticketId,
      user_id: userId,
      last_viewed_at: now,
      last_notified_at: existing?.last_notified_at ?? null,
    },
    { onConflict: "ticket_id,user_id" },
  );
}

export async function resetAssigneeReadForNewAssignee(
  ticketId: string,
  userId: string,
): Promise<void> {
  const supabase = requireAdmin();
  await supabase.from("admin_ticket_assignee_reads").upsert(
    {
      ticket_id: ticketId,
      user_id: userId,
      last_notified_at: null,
      last_viewed_at: null,
    },
    { onConflict: "ticket_id,user_id" },
  );
}

export async function getStaffEmailAndName(
  userId: string,
): Promise<{ email: string; name: string } | null> {
  const supabase = requireAdmin();
  const { data } = await supabase
    .from("admin_profiles")
    .select("email, name")
    .eq("id", userId)
    .maybeSingle();
  if (!data) return null;
  return { email: data.email as string, name: data.name as string };
}

export async function canUserShareTicket(
  ticketId: string,
  userId: string,
  hasManage: boolean,
): Promise<boolean> {
  if (hasManage) return true;
  const ticket = await getTicketById(ticketId);
  if (!ticket) return false;
  return ticket.reporterId === userId || ticket.assigneeId === userId;
}

export type TicketOrderLinkOption = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  status: string;
};

export async function searchOrdersForTicketLink(
  query: string,
): Promise<TicketOrderLinkOption[]> {
  const supabase = requireAdmin();
  let dbQuery = supabase
    .from("orders")
    .select("id, order_number, customer_name, customer_phone, status")
    .order("created_at", { ascending: false })
    .limit(20);

  if (query.trim()) {
    const term = query.trim();
    dbQuery = dbQuery.or(
      `order_number.ilike.%${term}%,customer_phone.ilike.%${term}%,customer_name.ilike.%${term}%`,
    );
  }

  const { data, error } = await dbQuery;
  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    id: row.id as string,
    orderNumber: row.order_number as string,
    customerName: row.customer_name as string,
    customerPhone: row.customer_phone as string,
    status: row.status as string,
  }));
}
