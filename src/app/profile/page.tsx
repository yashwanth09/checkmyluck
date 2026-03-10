import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

async function getUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export default async function ProfilePage() {
  const user = await getUser();

  async function updateProfile(formData: FormData) {
    "use server";
    const current = await getUser();
    const name = String(formData.get("name") || "").trim();
    const ageRaw = formData.get("age");
    const gender = String(formData.get("gender") || "").trim() || null;

    const ageNum = ageRaw ? Number(ageRaw) : null;
    const age =
      ageNum && Number.isFinite(ageNum) && ageNum > 0 && ageNum <= 120
        ? ageNum
        : null;

    await prisma.user.update({
      where: { id: current.id },
      data: {
        name: name || null,
        age: age ?? undefined,
        gender: gender ?? undefined,
      },
    });

    revalidatePath("/lobby");
    redirect("/lobby");
  }

  return (
    <div className="mx-auto min-h-screen max-w-md bg-zinc-50 px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
        Profile
      </h1>
      <p className="mt-1 text-sm text-zinc-600">
        Update your name and basic details. This helps make predictions more
        interesting.
      </p>

      <form action={updateProfile} className="mt-6 space-y-4">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-zinc-700"
          >
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            defaultValue={user.name ?? ""}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            placeholder="Your name"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="age"
              className="block text-sm font-medium text-zinc-700"
            >
              Age
            </label>
            <input
              id="age"
              name="age"
              type="number"
              min={1}
              max={120}
              defaultValue={user.age ?? ""}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
              placeholder="Optional"
            />
          </div>
          <div>
            <label
              htmlFor="gender"
              className="block text-sm font-medium text-zinc-700"
            >
              Gender
            </label>
            <select
              id="gender"
              name="gender"
              defaultValue={user.gender ?? ""}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            >
              <option value="">Prefer not to say</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          className="inline-flex w-full items-center justify-center rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"
        >
          Save profile
        </button>
      </form>
    </div>
  );
}

