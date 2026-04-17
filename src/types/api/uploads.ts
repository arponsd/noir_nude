export const UPLOAD_FOLDERS = ["products", "reviews", "users/avatars", "banners"] as const;

export type UploadFolder = (typeof UPLOAD_FOLDERS)[number];

export type UploadSign = {
  signature: string;
  timestamp: number;
  folder: UploadFolder;
  apiKey: string;
  cloudName: string;
};
