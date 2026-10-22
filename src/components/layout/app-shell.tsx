import { AppSidebar, MobileNav } from "@/components/layout/app-sidebar";
import { requireUser } from "@/lib/session";

export async function AppShell({
  children,
  title,
  description,
  actions,
}: {
  children: React.ReactNode;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  const user = await requireUser();
  return (
    <div className="flex min-h-full flex-1">
      <AppSidebar user={user} />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileNav user={user} />
        <header className="border-b border-border bg-card/60 px-4 py-5 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-6xl flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
                {title}
              </h1>
              {description ? (
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                  {description}
                </p>
              ) : null}
            </div>
            {actions ? (
              <div className="flex flex-wrap items-center gap-2">{actions}</div>
            ) : null}
          </div>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
