"use client";
import React from "react";

/**
 * Throughline brand mark: a line running through three nodes — the "through-line"
 * that connects partner → request → candidate → hire.
 */
export function ThroughlineMark({
  size = 32,
  color = "#1677ff",
  accent = "#ffffff",
}: {
  size?: number;
  color?: string;
  accent?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="8" fill={color} />
      <path d="M5 16h22" stroke={accent} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="9" cy="16" r="2.6" fill={accent} />
      <circle cx="23" cy="16" r="2.6" fill={accent} />
      <circle cx="16" cy="16" r="4.2" fill={color} stroke={accent} strokeWidth="2.5" />
    </svg>
  );
}

export default function ThroughlineLogo({
  size = 32,
  wordmark = true,
  light = false,
  className,
}: {
  size?: number;
  wordmark?: boolean;
  /** white wordmark for dark surfaces */
  light?: boolean;
  className?: string;
}) {
  return (
    <span
      className={className}
      style={{ display: "inline-flex", alignItems: "center", gap: Math.round(size * 0.35), lineHeight: 1 }}
    >
      <ThroughlineMark size={size} />
      {wordmark && (
        <span
          style={{
            fontFamily: "Outfit, Inter, system-ui, sans-serif",
            fontWeight: 600,
            fontSize: Math.round(size * 0.62),
            letterSpacing: "-0.01em",
            color: light ? "#ffffff" : "inherit",
            whiteSpace: "nowrap",
          }}
        >
          Throughline
        </span>
      )}
    </span>
  );
}
