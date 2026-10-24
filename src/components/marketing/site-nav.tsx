"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const LINKS = [
  { href: "#platform", label: "Platform" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#evidence", label: "Evidence" },
] as const;

export function SiteNav({
  workspaceHref,
  workspaceLabel,
}: {
  workspaceHref: string;
  workspaceLabel: string;
}) {
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const menuRef = useRef<HTMLElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const sections = LINKS.map((link) => document.querySelector(link.href)).filter((node): node is Element => node instanceof Element);
    const observer = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (hit) setCurrent(`#${hit.target.id}`);
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: [0.1] },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!open) return;
    const focus = window.setTimeout(() => {
      menuRef.current?.querySelector("a")?.focus();
    }, 0);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        menuButton.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(focus);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const bar = solid
    ? "border-[#F6F4EE]/10 bg-[#0A1018]/90 text-[#F6F4EE] backdrop-blur-sm"
    : "border-transparent bg-transparent text-[#F6F4EE]";

  return (
    <header className={`sticky top-0 z-40 border-b transition-colors duration-300 ${bar}`}>
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-md focus:bg-[#FFFDF8] focus:px-3 focus:py-2 focus:text-[#101820]"
      >
        Skip to content
      </a>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="room-shield flex min-h-11 items-center gap-2.5 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current">
          <ShieldMark />
          <span className="text-[15px] font-semibold tracking-tight">BrandGuard AI</span>
        </Link>
        <nav aria-label="Page" className="hidden items-center gap-1 md:flex">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} data-current={current === link.href} className="room-navlink relative inline-flex min-h-11 items-center rounded-md px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current">
              {link.label}
            </a>
          ))}
          <Link
            href={workspaceHref}
            className="inline-flex min-h-11 items-center rounded-md bg-[#A7F3C3] px-3.5 text-sm font-medium text-[#0A1018] transition-transform duration-150 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A7F3C3]"
          >
            {workspaceLabel}
          </Link>
        </nav>
        <button
          ref={menuButton}
          type="button"
          className="inline-flex min-h-11 items-center rounded-md px-3 text-sm md:hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>
      <nav
        ref={menuRef}
        id="mobile-nav"
        aria-label="Mobile"
        inert={!open}
        className={`grid bg-[#0A1018] text-[#F6F4EE] transition-[grid-template-rows] duration-300 md:hidden ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="overflow-hidden px-4">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} className="flex min-h-11 items-center text-sm" onClick={() => setOpen(false)}>
              {link.label}
            </a>
          ))}
          <Link href={workspaceHref} className="mb-2 flex min-h-11 items-center text-sm font-medium" onClick={() => setOpen(false)}>
            {workspaceLabel}
          </Link>
        </div>
      </nav>
    </header>
  );
}

function ShieldMark() {
  return (
    <svg aria-hidden viewBox="0 0 32 32" className="size-8">
      <path d="M16 3.5 26 7.2v8.4c0 6.2-4.1 10.4-10 12.9-5.9-2.5-10-6.7-10-12.9V7.2L16 3.5Z" fill="currentColor" opacity="0.14" />
      <path d="M16 3.5 26 7.2v8.4c0 6.2-4.1 10.4-10 12.9-5.9-2.5-10-6.7-10-12.9V7.2L16 3.5Z" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path className="room-check" d="M11.2 16.2 14.4 19.4 21 12.6" fill="none" stroke="#A7F3C3" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
