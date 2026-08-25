import RoleGuard from "@/components/shared/RoleGuard";

export default function CustomerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RoleGuard allow="customer">{children}</RoleGuard>;
}
