import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Show just the calendar day from a date string (trims ISO timestamps). */
export function formatDate(value: unknown): string {
  if (value == null) return ""
  const s = String(value)
  return s.length >= 10 && s[4] === "-" ? s.slice(0, 10) : s
}

/** Format a numeric amount with optional currency; returns "" for empty/non-numeric. */
export function formatAmount(amount: unknown, currency?: unknown): string {
  if (amount == null || amount === "") return ""
  const n = Number(amount)
  if (!Number.isFinite(n)) return ""
  const cur = currency ? ` ${String(currency)}` : ""
  return `${n.toFixed(0)}${cur}`
}
