import RoleGuard from "@/components/shared/RoleGuard";
import ProviderDashboardShell from "@/components/provider/ProviderDashboardShell";

export default function ProviderDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allow="provider">
      <ProviderDashboardShell>{children}</ProviderDashboardShell>
    </RoleGuard>
  );
}
