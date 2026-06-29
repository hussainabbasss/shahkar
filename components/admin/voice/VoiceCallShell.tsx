import { getAdminUser } from "@/lib/admin/auth";
import { VoiceCallProvider } from "@/components/admin/voice/VoiceCallProvider";

type VoiceCallShellProps = {
  children: React.ReactNode;
};

export async function VoiceCallShell({ children }: VoiceCallShellProps) {
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
