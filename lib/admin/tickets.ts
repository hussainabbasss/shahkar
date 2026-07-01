export type IssueType = "epic" | "story" | "task" | "subtask";
/** Department slug — see `admin_ticket_departments` */
export type TicketDepartment = string;
export type TicketStatus =
  | "backlog"
  | "todo"
  | "in_progress"
  | "done"
  | "cancelled";
export type TicketPriority = "low" | "medium" | "high" | "urgent";

export type TicketEntitySnapshot = {
  id: string;
  ticketKey: string;
  issueType: IssueType;
  department: TicketDepartment;
  departmentName: string;
  title: string;
  status: TicketStatus;
  priority: TicketPriority;
  assigneeName: string | null;
  parentKey: string | null;
  parentTitle: string | null;
};

export const BOARD_STATUSES: TicketStatus[] = ["todo", "in_progress", "done"];

export const ISSUE_TYPE_LABELS: Record<IssueType, string> = {
  epic: "Epic",
  story: "Story",
  task: "Task",
  subtask: "Sub-task",
};

export const DEFAULT_DEPARTMENT_LABELS: Record<string, string> = {
  development: "Development",
  sales: "Sales",
  marketing: "Marketing",
};

export const DEFAULT_DEPARTMENT_COLORS: Record<string, { bg: string; text: string }> = {
  development: { bg: "#E8F5EE", text: "#1B6B3A" },
  sales: { bg: "#FFF8ED", text: "#D4820A" },
  marketing: { bg: "#EFF6FF", text: "#2563EB" },
};

/** @deprecated Use TicketDepartmentRecord from DB */
export const DEPARTMENT_LABELS = DEFAULT_DEPARTMENT_LABELS;
/** @deprecated Use TicketDepartmentRecord from DB */
export const DEPARTMENT_COLORS = DEFAULT_DEPARTMENT_COLORS;

export type DepartmentDisplay = {
  name: string;
  bg: string;
  text: string;
};

export function getDepartmentDisplay(
  slug: string,
  departments: { slug: string; name: string; bgColor: string; textColor: string }[],
): DepartmentDisplay {
  const found = departments.find((d) => d.slug === slug);
  if (found) {
    return { name: found.name, bg: found.bgColor, text: found.textColor };
  }
  const fallback = DEFAULT_DEPARTMENT_COLORS[slug];
  return {
    name: DEFAULT_DEPARTMENT_LABELS[slug] ?? slug,
    bg: fallback?.bg ?? "#F3F4F6",
    text: fallback?.text ?? "#374151",
  };
}

export const STATUS_LABELS: Record<TicketStatus, string> = {
  backlog: "Backlog",
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done",
  cancelled: "Cancelled",
};

export const PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export const PRIORITY_COLORS: Record<TicketPriority, string> = {
  low: "#9CA3AF",
  medium: "#2563EB",
  high: "#D97706",
  urgent: "#DC2626",
};

export function formatTicketKey(ticketNumber: number): string {
  return `TKT-${ticketNumber}`;
}

export function parseTicketKey(key: string): number | null {
  const match = /^TKT-(\d+)$/i.exec(key.trim());
  if (!match) return null;
  return Number(match[1]);
}

export function isBoardIssueType(type: IssueType): boolean {
  return type === "story" || type === "task" || type === "subtask";
}

export function validateParentChild(
  issueType: IssueType,
  parentType: IssueType | null,
): string | null {
  if (issueType === "epic") {
    if (parentType) return "Epic cannot have a parent.";
    return null;
  }
  if (issueType === "story") {
    if (parentType && parentType !== "epic") {
      return "Story parent must be an Epic or none.";
    }
    return null;
  }
  if (issueType === "task") {
    if (!parentType) return null;
    if (parentType !== "story" && parentType !== "epic") {
      return "Task parent must be a Story or Epic.";
    }
    return null;
  }
  if (issueType === "subtask") {
    if (parentType !== "task") {
      return "Sub-task parent must be a Task.";
    }
    return null;
  }
  return "Invalid issue type.";
}

export function shouldSendAssignmentEmail(
  lastNotifiedAt: string | null,
  lastViewedAt: string | null,
): boolean {
  if (!lastNotifiedAt) return true;
  if (!lastViewedAt) return false;
  return new Date(lastViewedAt) >= new Date(lastNotifiedAt);
}

export function getAllowedChildTypes(parentType: IssueType): IssueType[] {
  if (parentType === "epic") return ["story", "task"];
  if (parentType === "story") return ["task"];
  if (parentType === "task") return ["subtask"];
  return [];
}

export function canHaveChildren(issueType: IssueType): boolean {
  return getAllowedChildTypes(issueType).length > 0;
}

export const MAX_TICKET_COMMENT_LENGTH = 2000;
