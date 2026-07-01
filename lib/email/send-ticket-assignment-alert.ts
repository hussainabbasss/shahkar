import { Resend } from "resend";
import {
  ISSUE_TYPE_LABELS,
  PRIORITY_LABELS,
  type IssueType,
  type TicketPriority,
} from "@/lib/admin/tickets";

let resendMissingLogged = false;

function getAppUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

export type TicketAssignmentAlertParams = {
  to: string;
  assigneeName: string;
  ticketKey: string;
  title: string;
  departmentName: string;
  issueType: IssueType;
  priority: TicketPriority;
  reporterName: string;
};

export async function sendTicketAssignmentAlertEmail(
  params: TicketAssignmentAlertParams,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    if (!resendMissingLogged) {
      console.warn(
        "[email] RESEND_API_KEY not set — skipping ticket assignment emails",
      );
      resendMissingLogged = true;
    }
    return;
  }

  const from = process.env.EMAIL_FROM ?? "Shahkar Admin <noreply@shahkar.store>";
  const appUrl = getAppUrl();
  const ticketUrl = `${appUrl}/admin/tickets/${params.ticketKey}`;

  const subject = `Assigned: ${params.ticketKey} — ${params.title}`;

  const resend = new Resend(apiKey);

  const { error } = await resend.emails.send({
    from,
    to: params.to,
    subject,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <p>Hi ${params.assigneeName},</p>
        <p>Aap ko yeh ticket assign hui hai:</p>
        <p style="font-size: 18px; font-weight: 700; color: #111827;">${params.ticketKey} — ${params.title}</p>
        <ul style="color: #1F2937; line-height: 1.8;">
          <li><strong>Department:</strong> ${params.departmentName}</li>
          <li><strong>Type:</strong> ${ISSUE_TYPE_LABELS[params.issueType]}</li>
          <li><strong>Priority:</strong> ${PRIORITY_LABELS[params.priority]}</li>
          <li><strong>Reporter:</strong> ${params.reporterName}</li>
        </ul>
        <p style="margin: 24px 0;">
          <a href="${ticketUrl}" style="background: #1B6B3A; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">
            Ticket kholo
          </a>
        </p>
        <p style="color: #9CA3AF; font-size: 12px;">Shahkar.store Admin</p>
      </div>
    `,
  });

  if (error) {
    throw new Error(error.message);
  }
}
