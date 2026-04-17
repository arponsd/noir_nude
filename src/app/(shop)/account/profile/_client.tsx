"use client";

import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { ProfileForm } from "@/components/account/ProfileForm";
import { NotificationsForm } from "@/components/account/NotificationsForm";
import { AccountDangerZone } from "@/components/account/AccountDangerZone";
import { signOutAction } from "@/app/(auth)/actions";
import {
  updateAvatarAction,
  updateNotificationPrefsAction,
  updateProfileAction,
} from "@/lib/actions/profile";
import { deleteAccountAction } from "@/lib/actions/account";
import type { UserProfile } from "@/types/api/user";
import type { SkinType } from "@/lib/constants";

export default function ProfileClient({ profile }: { profile: UserProfile }) {
  const { toast } = useToast();
  const router = useRouter();

  return (
    <div className="flex flex-col gap-12">
      <section aria-labelledby="profile-details">
        <h2 id="profile-details" className="font-display text-xl font-semibold tracking-[-0.01em]">
          Details
        </h2>
        <p className="mt-1 text-sm text-[var(--ink-soft)]">
          Update your display name, phone, date of birth, skin type, and avatar.
        </p>
        <div className="mt-4">
          <ProfileForm
            defaultValues={{
              name: profile.name,
              phone: profile.phone,
              dateOfBirth: profile.dateOfBirth?.slice(0, 10),
              skinType: profile.skinType as SkinType | undefined,
              avatarUrl: profile.avatar,
            }}
            onSubmit={async (values) => {
              if (values.avatarUrl && values.avatarUrl !== profile.avatar) {
                const avatarResult = await updateAvatarAction({ url: values.avatarUrl });
                if (!avatarResult.ok) throw new Error(avatarResult.error.message);
              }
              const result = await updateProfileAction({
                name: values.name,
                phone: values.phone || undefined,
                dateOfBirth: values.dateOfBirth || undefined,
                skinType: values.skinType,
              });
              if (!result.ok) throw new Error(result.error.message);
              toast({ title: "Profile updated" });
              router.refresh();
            }}
          />
        </div>
      </section>

      <section aria-labelledby="profile-notifications">
        <h2
          id="profile-notifications"
          className="font-display text-xl font-semibold tracking-[-0.01em]"
        >
          Notifications
        </h2>
        <p className="mt-1 text-sm text-[var(--ink-soft)]">Choose which emails we send you.</p>
        <div className="mt-4">
          <NotificationsForm
            defaultValues={profile.notificationPrefs}
            onSubmit={async (values) => {
              const result = await updateNotificationPrefsAction(values);
              if (!result.ok) throw new Error(result.error.message);
              toast({ title: "Preferences saved" });
              router.refresh();
            }}
          />
        </div>
      </section>

      <section aria-labelledby="profile-danger">
        <h2
          id="profile-danger"
          className="font-display text-xl font-semibold tracking-[-0.01em] text-[var(--danger)]"
        >
          Danger zone
        </h2>
        <p className="mt-1 text-sm text-[var(--ink-soft)]">
          Download everything we hold, or delete your account. Account deletion retains anonymized
          order history for accounting.
        </p>
        <div className="mt-4">
          <AccountDangerZone
            exportUrl="/api/user/export"
            onDelete={async () => {
              const result = await deleteAccountAction({ confirmation: "DELETE MY ACCOUNT" });
              if (!result.ok) throw new Error(result.error.message);
              await signOutAction();
            }}
          />
        </div>
      </section>
    </div>
  );
}
