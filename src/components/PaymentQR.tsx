"use client";

import { useEffect, useState } from "react";

type PaymentQRProps = {
  paymentId: string;
  referenceId: string;
  amount: number;
  groupName: string;
  onBack: () => void;
};

export function PaymentQR({
  paymentId,
  referenceId,
  amount,
  groupName,
  onBack,
}: PaymentQRProps) {
  const [status, setStatus] = useState<"pending" | "confirmed">("pending");

  useEffect(() => {
    const check = () => {
      fetch(`/api/payment/${paymentId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.status === "CONFIRMED") setStatus("confirmed");
        })
        .catch(() => {});
    };
    check();
    const id = setInterval(check, 5000);
    return () => clearInterval(id);
  }, [paymentId]);

  if (status === "confirmed") {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-600">
          ✓
        </div>
        <h3 className="mt-4 text-lg font-semibold text-zinc-900">
          Payment confirmed
        </h3>
        <p className="mt-2 text-sm text-zinc-600">
          You&apos;re now entered into this iPhone (17 <span className="text-[0.85em]">256 GB</span>) draw. Good luck!
        </p>
        <button
          onClick={onBack}
          className="mt-6 rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 transition hover:bg-violet-700"
        >
          Back to Groups
        </button>
      </div>
    );
  }

  const qrUrl = `/api/payment/${paymentId}/qr`;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h3 className="text-center text-sm font-medium uppercase tracking-widest text-zinc-500">
          Scan to Pay
        </h3>
        <p className="mt-1 text-center text-sm text-zinc-600">{groupName}</p>

        <div className="mx-auto mt-6 flex w-48 justify-center rounded-2xl bg-white p-4 ring-1 ring-zinc-200">
          <img
            src={qrUrl}
            alt="UPI Payment QR - scan with GPay, PhonePe or Paytm"
            width={180}
            height={180}
            className="rounded"
          />
        </div>

        <div className="mt-6 space-y-2 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">Amount</span>
            <span className="font-semibold text-zinc-900">₹{amount}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">Reference</span>
            <span className="font-mono text-xs text-zinc-700">
              {referenceId}
            </span>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-zinc-500">
          Scan with GPay, PhonePe or Paytm. Amount and reference are
          pre-filled. Money goes to BingoBids — admin will confirm shortly.
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 rounded-xl border-2 border-zinc-300 py-3 text-sm font-medium text-zinc-600 transition hover:border-zinc-400 hover:bg-zinc-50"
        >
          Cancel
        </button>
        <button
          onClick={() => window.location.reload()}
          className="flex-1 rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 transition hover:bg-violet-700"
        >
          Check Status
        </button>
      </div>
    </div>
  );
}
