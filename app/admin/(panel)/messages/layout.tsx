import { getAdminUser } from "@/lib/admin/auth";
import { VoiceCallProvider } from "@/components/admin/voice/VoiceCallProvider";

type MessagesVoiceLayoutProps = {
  children: React.ReactNode;
};

export default async function MessagesVoiceLayout({
  children,
}: MessagesVoiceLayoutProps) {
  const admin = await getAdminUser();

  if (!admin) {
    return <>{children}</>;
  }

  return (
    <VoiceCallProvider userId={admin.id} userName={admin.name}>
      {children}
    </VoiceCallProvider>
  );
}
