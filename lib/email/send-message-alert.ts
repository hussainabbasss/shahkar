import { Resend } from "resend";

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

export type MessageAlertParams = {
  to: string;
  recipientName: string;
  senderName: string;
  conversationType: "dm" | "group";
  groupName?: string | null;
  conversationId: string;
};

export async function sendMessageAlertEmail(
  params: MessageAlertParams,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    if (!resendMissingLogged) {
      console.warn(
        "[email] RESEND_API_KEY not set — skipping message alert emails",
      );
      resendMissingLogged = true;
    }
    return;
  }

  const from = process.env.EMAIL_FROM ?? "Shahkar Admin <noreply@shahkar.store>";
  const appUrl = getAppUrl();
  const messagesUrl = `${appUrl}/admin/messages/${params.conversationId}`;

  const subject =
    params.conversationType === "group" && params.groupName
      ? `New message — ${params.senderName} posted in "${params.groupName}"`
      : `New message — ${params.senderName} sent you a message`;

  const bodyText =
    params.conversationType === "group"
      ? `${params.senderName} sent a new message in the group "${params.groupName ?? "chat"}". Open Messages to read it.`
      : `${params.senderName} sent you a new message. Open Messages to read it.`;

  const resend = new Resend(apiKey);

  const { error } = await resend.emails.send({
    from,
    to: params.to,
    subject,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <p>Hi ${params.recipientName},</p>
        <p>${bodyText}</p>
        <p style="margin: 24px 0;">
          <a href="${messagesUrl}" style="background: #1B6B3A; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">
            Open messages
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
