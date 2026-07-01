import { createAdminClient } from "@/lib/supabase/admin";

function requireAdmin() {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Supabase not configured");
  return supabase;
}

export type TicketDepartmentRecord = {
  slug: string;
  name: string;
  bgColor: string;
  textColor: string;
  sortOrder: number;
};

type DbDepartment = {
  slug: string;
  name: string;
  bg_color: string;
  text_color: string;
  sort_order: number;
};

function mapDepartment(row: DbDepartment): TicketDepartmentRecord {
  return {
    slug: row.slug,
    name: row.name,
    bgColor: row.bg_color,
    textColor: row.text_color,
    sortOrder: row.sort_order,
  };
}

const DEFAULT_DEPARTMENT_COLORS = [
  { bg: "#F3F4F6", text: "#374151" },
  { bg: "#FDF2F8", text: "#BE185D" },
  { bg: "#F5F3FF", text: "#6D28D9" },
  { bg: "#ECFEFF", text: "#0E7490" },
  { bg: "#FFF7ED", text: "#C2410C" },
];

export function slugifyDepartmentName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export async function listTicketDepartments(): Promise<TicketDepartmentRecord[]> {
  const supabase = requireAdmin();
  const { data, error } = await supabase
    .from("admin_ticket_departments")
    .select("*")
    .order("sort_order")
    .order("name");
  if (error) throw new Error(error.message);
  return (data as DbDepartment[]).map(mapDepartment);
}

export async function getTicketDepartmentBySlug(
  slug: string,
): Promise<TicketDepartmentRecord | null> {
  const supabase = requireAdmin();
  const { data, error } = await supabase
    .from("admin_ticket_departments")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapDepartment(data as DbDepartment);
}

export async function createTicketDepartment(input: {
  name: string;
  slug?: string;
}): Promise<TicketDepartmentRecord> {
  const supabase = requireAdmin();
  const name = input.name.trim();
  if (name.length < 2) {
    throw new Error("Department name must be at least 2 characters.");
  }

  let slug = input.slug?.trim() || slugifyDepartmentName(name);
  if (!slug) {
    throw new Error("Could not generate a valid department slug.");
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error("Department slug is invalid.");
  }

  const existing = await listTicketDepartments();
  if (existing.some((d) => d.slug === slug)) {
    slug = `${slug}-${existing.length + 1}`;
  }

  const palette =
    DEFAULT_DEPARTMENT_COLORS[existing.length % DEFAULT_DEPARTMENT_COLORS.length]!;

  const { data, error } = await supabase
    .from("admin_ticket_departments")
    .insert({
      slug,
      name,
      bg_color: palette.bg,
      text_color: palette.text,
      sort_order: existing.length + 1,
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("A department with this name already exists.");
    }
    throw new Error(error.message);
  }

  return mapDepartment(data as DbDepartment);
}

export async function assertDepartmentExists(slug: string): Promise<void> {
  const dept = await getTicketDepartmentBySlug(slug);
  if (!dept) throw new Error("Invalid department selected.");
}
