"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

function scrollToSection(id: string) {
  const deadline = Date.now() + 1000;
  function attempt() {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      const url = new URL(window.location.href);
      url.searchParams.delete("scroll");
      window.history.replaceState(null, "", url.toString());
    } else if (Date.now() < deadline) {
      requestAnimationFrame(attempt);
    }
  }
  requestAnimationFrame(attempt);
}

export function ScrollOnLoad() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const section = searchParams.get("scroll");
    if (section) {
      scrollToSection(section);
    }
  }, [searchParams]);

  return null;
}
