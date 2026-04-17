"use server";

import { revalidatePath } from "next/cache";
import { safeAction } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/require-role";
import {
  avatarUpdateSchema,
  notificationPrefsSchema,
  profileUpdateSchema,
  type NotificationPrefsInput,
  type ProfileUpdateInput,
} from "@/lib/validators/user";
import {
  getProfile,
  updateAvatar,
  updateNotificationPrefs,
  updateProfile,
} from "@/lib/services/profile";
import type { UserProfile } from "@/types/api/user";

function revalidateProfilePaths(): void {
  revalidatePath("/account");
  revalidatePath("/account/profile");
  revalidatePath("/account/settings");
}

export const getProfileAction = safeAction(async (): Promise<UserProfile> => {
  const session = await requireAuth();
  return getProfile(session.user.id);
});

export const updateProfileAction = safeAction(
  async (input: ProfileUpdateInput): Promise<UserProfile> => {
    const session = await requireAuth();
    const parsed = profileUpdateSchema.parse(input);
    const profile = await updateProfile(session.user.id, parsed);
    revalidateProfilePaths();
    return profile;
  },
);

export const updateAvatarAction = safeAction(
  async (input: { url: string }): Promise<UserProfile> => {
    const session = await requireAuth();
    const { url } = avatarUpdateSchema.parse(input);
    const profile = await updateAvatar(session.user.id, url);
    revalidateProfilePaths();
    return profile;
  },
);

export const updateNotificationPrefsAction = safeAction(
  async (input: NotificationPrefsInput): Promise<UserProfile> => {
    const session = await requireAuth();
    const parsed = notificationPrefsSchema.parse(input);
    const profile = await updateNotificationPrefs(session.user.id, parsed);
    revalidateProfilePaths();
    return profile;
  },
);
