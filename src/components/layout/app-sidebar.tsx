"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, ShieldCheck } from "lucide-react";

import { logoutAction } from "@/app/actions/auth";
import { NAV_ITEMS } from "@/components/layout/nav-items";
import type { SessionUser } from "@/lib/session";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary" className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-md border border-transparent px-3 py-2 text-sm transition-colors",
              "hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              active
                ? "border-border bg-card font-medium text-foreground shadow-[0_1px_2px_rgba(28,25,23,0.05)]"
                : "text-muted-foreground",
            )}
          >
            <Icon aria-hidden className="size-4 shrink-0" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function BrandMark() {
  return (
    <Link
      href="/dashboard"
      className="flex items-center gap-2.5 rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <span className="flex size-9 items-center justify-center rounded-md border border-border bg-primary text-primary-foreground">
        <ShieldCheck aria-hidden className="size-4" />
      </span>
      <span className="flex flex-col leading-tight">
        <span className="font-heading text-base font-semibold tracking-tight">
          BrandGuard
        </span>
        <span className="text-[11px] text-muted-foreground">
          Evidence-gated review
        </span>
      </span>
    </Link>
  );
}

function AccountFooter({ user }: { user: SessionUser }) {
  return (
    <div className="mt-auto px-3 pt-6">
      <p className="text-sm font-medium">{user.name}</p>
      <p className="text-xs text-muted-foreground">
        {user.role} · {user.orgName}
      </p>
      <form action={logoutAction} className="mt-3">
        <button
          type="submit"
          className="text-xs text-muted-foreground underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}

export function AppSidebar({ user }: { user: SessionUser }) {
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar/80 px-3 py-4 md:flex">
      <div className="mb-6 px-1">
        <BrandMark />
      </div>
      <NavLinks />
      <AccountFooter user={user} />
    </aside>
  );
}

export function MobileNav({ user }: { user: SessionUser }) {
  return (
    <div className="flex items-center justify-between border-b border-border bg-card/80 px-4 py-3 md:hidden">
      <BrandMark />
      <Sheet>
        <SheetTrigger
          render={
            <Button variant="outline" size="icon" aria-label="Open navigation" />
          }
        >
          <Menu aria-hidden />
        </SheetTrigger>
        <SheetContent side="left" className="w-72 bg-sidebar p-4">
          <SheetHeader className="mb-4 p-0">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <NavLinks />
          <AccountFooter user={user} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
