// TODO import when backend ships `@/types/api/user`.
// Local fallback types for account primitives. Shapes follow the user profile
// fields referenced in `docs/06-api-contract.md` (GET /api/user/profile).

import type { SkinType } from "@/lib/constants";

export interface UserProfileDTO {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  dateOfBirth?: string | null;
  skinType?: SkinType | null;
  avatarUrl?: string | null;
}

export interface ProfileFormValues {
  name: string;
  phone?: string;
  dateOfBirth?: string;
  skinType?: SkinType;
  avatarUrl?: string;
}

export interface NotificationPreferences {
  orderUpdates: boolean;
  promos: boolean;
  newsletter: boolean;
}
