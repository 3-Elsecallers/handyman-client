import RoleGuard from "@/components/shared/RoleGuard";
import AdminDashboardShell from "@/components/admin/AdminDashboardShell";

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allow="admin">
      <AdminDashboardShell>{children}</AdminDashboardShell>
    </RoleGuard>
  );
}
