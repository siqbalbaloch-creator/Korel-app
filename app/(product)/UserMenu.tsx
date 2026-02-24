"use client";

import { useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { LogOut, ShieldCheck } from "lucide-react";

type UserMenuProps = {
  name: string | null;
  email: string | null;
  image: string | null;
  initials: string;
  isAdmin: boolean;
};

export default function UserMenu({
  name,
  email,
  image,
  initials,
  isAdmin,
}: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-3 text-xs text-[#64748B] w-full rounded-lg px-1.5 py-1.5 -ml-1.5 hover:bg-[#F1F5F9] transition-colors"
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt=""
            referrerPolicy="no-referrer"
            className="h-8 w-8 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div
            className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #6D5EF3 0%, #8B7CFF 100%)" }}
          >
            {initials}
          </div>
        )}
        <span className="truncate">{name ?? email ?? "Free Plan"}</span>
      </button>

      {open && (
        <div className="absolute bottom-full left-0 mb-2 w-52 rounded-xl border border-neutral-200 bg-white shadow-lg py-1.5 z-50">
          {/* Identity */}
          <div className="px-3 pb-1.5 mb-1 border-b border-neutral-100">
            <p className="text-xs font-medium text-neutral-900 truncate">
              {name ?? email}
            </p>
            {name && (
              <p className="text-[11px] text-neutral-400 truncate">{email}</p>
            )}
          </div>

          {/* Admin Panel — only for admins */}
          {isAdmin && (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-[#4F46E5] hover:bg-[#EEF2FF] transition-colors"
            >
              <ShieldCheck className="h-4 w-4" />
              Admin Panel
            </Link>
          )}

          {isAdmin && <div className="h-px bg-neutral-100 mx-2 my-1" />}

          {/* Sign Out */}
          <button
            type="button"
            onClick={() => void signOut({ callbackUrl: "/signin" })}
            className="flex items-center gap-2.5 px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50 w-full transition-colors"
          >
            <LogOut className="h-4 w-4 text-neutral-400" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
