import { GroupStatus } from "@prisma/client";

export function formatRupees(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
  }).format(date);
}

export function getStatusBadgeColor(status: GroupStatus): string {
  switch (status) {
    case "OPEN":
      return "bg-emerald-100 text-emerald-700";
    case "FULL":
      return "bg-amber-100 text-amber-700";
    case "CLOSED":
      return "bg-zinc-200 text-zinc-600";
    case "DRAW_DONE":
      return "bg-violet-100 text-violet-700";
    default:
      return "bg-zinc-200 text-zinc-600";
  }
}

export function getStatusLabel(status: GroupStatus): string {
  switch (status) {
    case "OPEN":
      return "Open";
    case "FULL":
      return "Full";
    case "CLOSED":
      return "Closed";
    case "DRAW_DONE":
      return "Draw Complete";
    default:
      return status;
  }
}
