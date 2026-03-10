"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PaymentQR } from "./PaymentQR";
import { formatRupees } from "@/lib/utils";

type Criterion = { id: string; label: string; type: string; value: number | null };

type GroupInfo = {
  id: string;
  name: string;
  maxMembers: number;
  entryFee: number;
  status: string;
  closesAt: string;
  memberCount: number;
  slotsLeft: number;
  criteria?: Criterion[];
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
    virtual: boolean;
  } | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [address, setAddress] = useState("");
  const [dob, setDob] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [selectedCriterionId, setSelectedCriterionId] = useState("");
  const [mode] = useState<"VIRTUAL">("VIRTUAL"); // Real money disabled for now

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
          bidCount: 1,
          mode,
          ...(group.criteria?.length
            ? {
                age: age === "" ? undefined : Number(age),
                gender: gender || undefined,
                selectedCriterionId: selectedCriterionId || undefined,
              }
            : {}),
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
        virtual: !!data.virtual,
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
    if (payment.virtual) {
      return (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
          <h3 className="text-lg font-semibold text-zinc-900">
            Joined with virtual money
          </h3>
          <p className="mt-2 text-sm text-zinc-600">
            This entry used test credits (no real payment). You have {payment.totalBids} bid
            {payment.totalBids > 1 ? "s" : ""} in this group.
          </p>
          <button
            onClick={() => {
              setPayment(null);
              router.refresh();
            }}
            className="mt-6 rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 transition hover:bg-violet-700"
          >
            Back to group list
          </button>
        </div>
      );
    }
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

  const totalAmount = group.entryFee;
  const isFull = group.slotsLeft <= 0;
  const isExpired = new Date(group.closesAt).getTime() <= Date.now();
  const isOpen = group.status === "OPEN" && !isExpired;
  const isDrawDone = group.status === "DRAW_DONE";

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-zinc-900">{group.name}</h2>
        <p className="mt-1 text-sm text-zinc-500">
          {group.memberCount} / {group.maxMembers} members •{" "}
          {group.slotsLeft} slots left
        </p>
        {isFull && (
          <p className="mt-1 text-xs font-medium text-amber-700">
            This group is full. New joins are disabled.
          </p>
        )}
        {isExpired && !isDrawDone && (
          <p className="mt-1 text-xs font-medium text-amber-700">
            Time&apos;s up. This group is dissolved.
          </p>
        )}
        {!isOpen && !isExpired && !isDrawDone && (
          <p className="mt-1 text-xs font-medium text-zinc-600">
            This group is closed. You can&apos;t join now.
          </p>
        )}
      </div>

      {isDrawDone && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          Draw complete. Winners are based on the chosen criteria.
          <a
            href={`/join/${group.id}/results`}
            className="ml-2 font-semibold text-emerald-900 underline"
          >
            View results
          </a>
        </div>
      )}

      {!isOpen || isFull ? null : (
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
        <div className="rounded-xl border border-violet-200 bg-violet-50/60 p-3">
          <p className="text-xs font-medium text-violet-900">
            For now, all joins use <strong>virtual money</strong> with ₹20 free test credit. Real UPI
            payments are disabled while you test the app.
          </p>
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
            rows={2}
            placeholder="Area / city"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            required
            minLength={4}
          />
        </div>

        {group.criteria && group.criteria.length > 0 && (
          <>
            <div className="rounded-xl border border-violet-200 bg-violet-50/50 p-3">
              <p className="text-sm font-medium text-violet-900">
                Winning criteria — pick one. If it matches the group after it fills, you win.
              </p>
            </div>
            <div>
              <label htmlFor="dob" className="block text-sm font-medium text-zinc-700">
                Date of birth
              </label>
              <input
                id="dob"
                type="date"
                value={dob}
                onChange={(e) => {
                  const value = e.target.value;
                  setDob(value);
                  if (!value) {
                    setAge("");
                    return;
                  }
                  const birth = new Date(value);
                  const today = new Date();
                  let years =
                    today.getFullYear() - birth.getFullYear();
                  const m = today.getMonth() - birth.getMonth();
                  if (
                    m < 0 ||
                    (m === 0 && today.getDate() < birth.getDate())
                  ) {
                    years--;
                  }
                  if (years > 0 && years <= 120) {
                    setAge(String(years));
                  } else {
                    setAge("");
                  }
                }}
                className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                required={group.criteria.length > 0}
              />
            </div>
            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-zinc-700">
                Gender
              </label>
              <select
                id="gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                required={group.criteria.length > 0}
              >
                <option value="">Select</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label htmlFor="criterion" className="block text-sm font-medium text-zinc-700">
                Your winning criterion
              </label>
              <select
                id="criterion"
                value={selectedCriterionId}
                onChange={(e) => setSelectedCriterionId(e.target.value)}
                className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                required={group.criteria.length > 0}
              >
                <option value="">Select one</option>
                {group.criteria.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

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
      )}
    </div>
  );
}
