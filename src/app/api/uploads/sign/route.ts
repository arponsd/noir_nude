import { NextResponse } from "next/server";
import { z } from "zod";
import { v2 as cloudinary } from "cloudinary";
import { fail, ok, safeRoute } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/require-role";
import { ERROR_CODES } from "@/lib/constants";
import { env } from "@/lib/env";
import { UPLOAD_FOLDERS, type UploadSign } from "@/types/api/uploads";

const bodySchema = z
  .object({
    folder: z.enum(UPLOAD_FOLDERS),
  })
  .strict();

export const POST = safeRoute(async (req: Request) => {
  await requireAuth();

  const raw: unknown = await req.json().catch(() => ({}));
  const { folder } = bodySchema.parse(raw);

  const cloudName = env.CLOUDINARY_CLOUD_NAME ?? env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = env.CLOUDINARY_API_KEY;
  const apiSecret = env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json(
      fail(ERROR_CODES.CLOUDINARY_SIGN_FAILED, "Cloudinary not configured"),
      { status: 503 },
    );
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request({ timestamp, folder }, apiSecret);

  const payload: UploadSign = {
    signature,
    timestamp,
    folder,
    apiKey,
    cloudName,
  };
  return NextResponse.json(ok(payload));
});
