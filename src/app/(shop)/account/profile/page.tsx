import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getProfile } from "@/lib/services/profile";
import ProfileClient from "./_client";

export const metadata = {
  title: "Profile",
};

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await auth();
  if (!session) redirect("/login?next=/account/profile");

  const profile = await getProfile(session.user.id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <p className="text-xs font-medium tracking-[0.12em] text-[var(--ink-soft)] uppercase">
          Account
        </p>
        <h1 className="font-display mt-2 text-3xl font-semibold tracking-[-0.02em] text-[var(--ink)]">
          My profile
        </h1>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">
          Signed in as <span className="text-[var(--ink)]">{profile.email}</span>
          {profile.emailVerified ? null : " · email not verified"}
        </p>
      </header>

      <ProfileClient profile={profile} />
    </div>
  );
}
