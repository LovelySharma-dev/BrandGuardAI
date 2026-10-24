import { redirect } from "next/navigation";

import { loginAction } from "@/app/actions/auth";
import { DEMO_ACCOUNTS } from "@/db/seed";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

function roleCaption(account: (typeof DEMO_ACCOUNTS)[number]): string {
  if (account.orgId === "org_other") return "Other organisation";
  if (account.role === "reviewer") return "Reviewer";
  if (account.role === "admin") return "Admin";
  return "Author";
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");
  const params = await searchParams;
  const failed = params.error === "credentials";
  const limited = params.error === "rate";

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
          {limited ? (
            <p role="alert" className="text-sm text-destructive">
              Too many sign-in attempts. Wait a few minutes and try again.
            </p>
          ) : null}
          <div className="flex flex-col gap-2">
            <p id="role-signin-note" className="text-sm text-muted-foreground">
              For judging convenience, choose a role. Each button signs that
              demo account in. Sign out to try another role.
            </p>
            <ul className="flex flex-col gap-2" aria-describedby="role-signin-note">
              {DEMO_ACCOUNTS.map((account) => (
                <li key={account.id}>
                  <form action={loginAction}>
                    <input type="hidden" name="email" value={account.email} />
                    <input type="hidden" name="password" value={DEMO_PASSWORD} />
                    <Button
                      type="submit"
                      variant="outline"
                      className="h-auto min-h-11 w-full justify-between gap-3 px-3 py-2 text-left whitespace-normal"
                    >
                      <span className="flex min-w-0 flex-col items-start">
                        <span>{account.name}</span>
                        <span className="text-muted-foreground">{account.email}</span>
                      </span>
                      <span className="shrink-0">{roleCaption(account)}</span>
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          </div>
          <form action={loginAction} className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">Or enter an email and password.</p>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" autoComplete="username" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>
            <Button type="submit" className="min-h-11">Sign in</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
