"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PaymentQR } from "./PaymentQR";
import { formatRupees } from "@/lib/utils";
import { MAX_BIDS_PER_MEMBER, ENTRY_FEE } from "@/lib/constants";

type GroupInfo = {
  id: string;
  name: string;
  maxMembers: number;
  entryFee: number;
  status: string;
  closesAt: string;
  memberCount: number;
  slotsLeft: number;
};

export function JoinForm({ groupId }: { groupId: string }) {
  const router = useRouter();
  const [group, setGroup] = useState<GroupInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payment, setPayment] = useState<{
    paymentId: string;
    referenceId: string;
    amount: number;
    totalBids: number;
  } | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [address, setAddress] = useState("");
  const [bidCount, setBidCount] = useState(1);

  useEffect(() => {
    fetch(`/api/groups/${groupId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setGroup(data);
      })
      .catch(() => setError("Failed to load group"))
      .finally(() => setLoading(false));
  }, [groupId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!group || submitting) return;
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId,
          displayName: displayName.trim() || undefined,
          mobileNumber: mobileNumber.replace(/\s/g, ""),
          address: address.trim(),
          bidCount,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setSubmitting(false);
        return;
      }

      setPayment({
        paymentId: data.paymentId,
        referenceId: data.referenceId,
        amount: data.amount,
        totalBids: data.totalBids,
      });
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" />
      </div>
    );
  }

  if (error && !group) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
        {error}
      </div>
    );
  }

  if (payment) {
    return (
      <PaymentQR
        paymentId={payment.paymentId}
        referenceId={payment.referenceId}
        amount={payment.amount}
        groupName={group?.name ?? ""}
        onBack={() => {
          setPayment(null);
          router.refresh();
        }}
      />
    );
  }

  if (!group) return null;

  const totalAmount = bidCount * ENTRY_FEE;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-zinc-900">{group.name}</h2>
        <p className="mt-1 text-sm text-zinc-500">
          {group.memberCount} / {group.maxMembers} members • {group.slotsLeft}{" "}
          slots left
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-zinc-700"
          >
            Your name <span className="text-zinc-400">(optional, for winner display)</span>
          </label>
          <input
            id="name"
            type="text"
            placeholder="e.g. Rahul K."
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          />
        </div>
        <div>
          <label
            htmlFor="mobile"
            className="block text-sm font-medium text-zinc-700"
          >
            Mobile Number
          </label>
          <input
            id="mobile"
            type="tel"
            inputMode="numeric"
            pattern="[6-9][0-9]{9}"
            maxLength={10}
            placeholder="9876543210"
            value={mobileNumber}
            onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ""))}
            className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            required
          />
        </div>

        <div>
          <label
            htmlFor="address"
            className="block text-sm font-medium text-zinc-700"
          >
            Address
          </label>
          <textarea
            id="address"
            rows={3}
            placeholder="Full address for delivery"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            required
            minLength={10}
          />
        </div>

        <div>
          <label
            htmlFor="bids"
            className="block text-sm font-medium text-zinc-700"
          >
            Number of Bids (1–{MAX_BIDS_PER_MEMBER})
          </label>
          <select
            id="bids"
            value={bidCount}
            onChange={(e) => setBidCount(Number(e.target.value))}
            className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          >
            {Array.from({ length: MAX_BIDS_PER_MEMBER }, (_, i) => i + 1).map(
              (n) => (
                <option key={n} value={n}>
                  {n} bid{n > 1 ? "s" : ""} — {formatRupees(n * ENTRY_FEE)}
                </option>
              )
            )}
          </select>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-sm font-medium text-zinc-900">
            Total: {formatRupees(totalAmount)}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Pay via QR code after submitting
          </p>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-violet-600 py-4 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 transition hover:bg-violet-700 hover:shadow-violet-600/30 disabled:opacity-50 disabled:shadow-none"
        >
          {submitting ? "Joining..." : "Join & Get Payment QR"}
        </button>
      </form>
    </div>
  );
}
