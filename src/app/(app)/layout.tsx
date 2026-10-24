import { requireUser } from "@/lib/session";

export const maxDuration = 60;

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser();
  return children;
}
