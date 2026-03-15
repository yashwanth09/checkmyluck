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
    const state = String(formData.get("state") || "").trim() || null;
    const dobRaw = String(formData.get("dob") || "").trim();

    const ageNum = ageRaw ? Number(ageRaw) : null;
    const age =
      ageNum && Number.isFinite(ageNum) && ageNum > 0 && ageNum <= 120
        ? ageNum
        : null;

    let dateOfBirth: Date | null = null;
    if (dobRaw) {
      const parsed = new Date(dobRaw);
      if (!Number.isNaN(parsed.getTime())) {
        dateOfBirth = parsed;
      }
    }

    await prisma.user.update({
      where: { id: current.id },
      data: {
        name: name || null,
        age: age ?? undefined,
        gender: gender ?? undefined,
        state: state ?? undefined,
        dateOfBirth: dateOfBirth ?? undefined,
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
              htmlFor="dob"
              className="block text-sm font-medium text-zinc-700"
            >
              Date of birth
            </label>
            <input
              id="dob"
              name="dob"
              type="date"
              defaultValue={
                user.dateOfBirth
                  ? new Date(user.dateOfBirth).toISOString().slice(0, 10)
                  : ""
              }
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
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

        <div>
          <label
            htmlFor="state"
            className="block text-sm font-medium text-zinc-700"
          >
            State
          </label>
          <select
            id="state"
            name="state"
            defaultValue={user.state ?? ""}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
          >
            <option value="">Select state</option>
            <option value="Andhra Pradesh">Andhra Pradesh</option>
            <option value="Arunachal Pradesh">Arunachal Pradesh</option>
            <option value="Assam">Assam</option>
            <option value="Bihar">Bihar</option>
            <option value="Chhattisgarh">Chhattisgarh</option>
            <option value="Goa">Goa</option>
            <option value="Gujarat">Gujarat</option>
            <option value="Haryana">Haryana</option>
            <option value="Himachal Pradesh">Himachal Pradesh</option>
            <option value="Jharkhand">Jharkhand</option>
            <option value="Karnataka">Karnataka</option>
            <option value="Kerala">Kerala</option>
            <option value="Madhya Pradesh">Madhya Pradesh</option>
            <option value="Maharashtra">Maharashtra</option>
            <option value="Manipur">Manipur</option>
            <option value="Meghalaya">Meghalaya</option>
            <option value="Mizoram">Mizoram</option>
            <option value="Nagaland">Nagaland</option>
            <option value="Odisha">Odisha</option>
            <option value="Punjab">Punjab</option>
            <option value="Rajasthan">Rajasthan</option>
            <option value="Sikkim">Sikkim</option>
            <option value="Tamil Nadu">Tamil Nadu</option>
            <option value="Telangana">Telangana</option>
            <option value="Tripura">Tripura</option>
            <option value="Uttar Pradesh">Uttar Pradesh</option>
            <option value="Uttarakhand">Uttarakhand</option>
            <option value="West Bengal">West Bengal</option>
            <option value="Andaman and Nicobar Islands">
              Andaman and Nicobar Islands
            </option>
            <option value="Chandigarh">Chandigarh</option>
            <option value="Dadra and Nagar Haveli and Daman and Diu">
              Dadra and Nagar Haveli and Daman and Diu
            </option>
            <option value="Delhi">Delhi</option>
            <option value="Jammu and Kashmir">Jammu and Kashmir</option>
            <option value="Ladakh">Ladakh</option>
            <option value="Lakshadweep">Lakshadweep</option>
            <option value="Puducherry">Puducherry</option>
          </select>
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

