import { redirect } from "next/navigation";

import { loginAction } from "@/app/actions/auth";
import { DEMO_ACCOUNTS } from "@/db/seed";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DEMO_PASSWORD } from "@/lib/password";
import { getCurrentUser } from "@/lib/session";

export const metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");
  const params = await searchParams;
  const failed = params.error === "credentials";

  return (
    <main className="mx-auto flex min-h-full max-w-lg flex-col justify-center px-4 py-16">
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>
            Roles are stored with the user. The approval action reads that
            role from the session, and every review query is limited to the
            user&apos;s organisation.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {failed ? (
            <p role="alert" className="text-sm text-destructive">
              Email or password is wrong.
            </p>
          ) : null}
          <p className="text-sm text-muted-foreground">
            Demo password for every account:{" "}
            <span className="font-mono">{DEMO_PASSWORD}</span>
          </p>
          <ul className="flex flex-col gap-2">
            {DEMO_ACCOUNTS.map((account) => (
              <li key={account.id}>
                <form action={loginAction}>
                  <input type="hidden" name="email" value={account.email} />
                  <input type="hidden" name="password" value={DEMO_PASSWORD} />
                  <Button type="submit" variant="outline" className="w-full justify-between">
                    <span>{account.name}</span>
                    <span className="text-muted-foreground">{account.role}</span>
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </main>
  );
}
