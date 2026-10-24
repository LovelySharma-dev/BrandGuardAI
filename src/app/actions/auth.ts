"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { createSession, deleteSession, findUserByEmail } from "@/db/repository";
import { verifyPassword } from "@/lib/password";
import { consumeRateLimit, loginAttemptLimit } from "@/lib/rate-limit";
import { SESSION_COOKIE } from "@/lib/session";

export async function loginAction(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const limited = await consumeRateLimit({
    bucket: `login:${email.slice(0, 180) || "blank"}`,
    limit: loginAttemptLimit(),
  });
  if (!limited.ok) redirect("/login?error=rate");
  const user = await findUserByEmail(email);
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    redirect("/login?error=credentials");
  }

  const token = await createSession(user.id);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await deleteSession(token);
  jar.delete(SESSION_COOKIE);
  redirect("/login");
}
