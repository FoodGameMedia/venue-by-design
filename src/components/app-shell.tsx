import { AppNav } from "@/components/app-nav";
import { PublicFooter } from "@/components/sales/public-footer";

export function AppShell({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-transparent">
      <AppNav title={title} />
      <div className="flex flex-1 flex-col">{children}</div>
      <PublicFooter />
    </div>
  );
}
