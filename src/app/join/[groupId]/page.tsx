import { JoinForm } from "@/components/JoinForm";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center px-4 py-4 sm:px-6 md:max-w-4xl lg:max-w-6xl">
          <a
            href="/"
            className="text-sm text-zinc-500 transition hover:text-zinc-900"
            aria-label="Back"
          >
            ← All groups
          </a>
          <h1 className="ml-4 text-sm font-medium uppercase tracking-widest text-zinc-500">
            Join this draw
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8 pb-12 sm:px-6 md:max-w-4xl lg:max-w-6xl">
        <div className="mx-auto max-w-xl">
          <JoinForm groupId={groupId} />
        </div>
      </main>
    </div>
  );
}
