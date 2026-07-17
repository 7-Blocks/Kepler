"use client";

import { useState } from "react";

interface TechLogoProps {
  name: string;
  slug?: string;
  colorHex: string;
  accentClass: string;
}

export function TechLogo({ name, slug, colorHex, accentClass }: TechLogoProps) {
  const [failed, setFailed] = useState(false);
  const initials = name
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${accentClass}`}>
      {!slug || failed ? (
        <span className="font-[JetBrains_Mono] text-[11px] font-semibold">{initials}</span>
      ) : (
        <img
          src={`https://cdn.simpleicons.org/${slug}/${colorHex}`}
          alt={`${name} logo`}
          width={20}
          height={20}
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-5 w-5"
        />
      )}
    </div>
  );
}