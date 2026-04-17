"use client";

import * as React from "react";
import Image from "next/image";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import type { UploadSign } from "@/types/api/uploads";

export interface AvatarUploaderProps {
  value?: string | null;
  name?: string;
  onChange: (nextUrl: string | null) => void;
  size?: number;
  className?: string;
}

function getInitials(name?: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return (parts[0]?.[0] ?? "?").toUpperCase();
  const first = parts[0]?.[0] ?? "";
  const last = parts[parts.length - 1]?.[0] ?? "";
  return `${first}${last}`.toUpperCase();
}

/**
 * Signed Cloudinary avatar uploader. Follows the admin CloudinaryUploader
 * pattern but tailored to a single circular avatar with initials fallback.
 */
export function AvatarUploader({
  value,
  name,
  onChange,
  size = 80,
  className,
}: AvatarUploaderProps) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleFile = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const signRes = await fetch("/api/uploads/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder: "users/avatars" }),
        credentials: "same-origin",
      });
      const signJson = (await signRes.json()) as
        | { ok: true; data: UploadSign }
        | { ok: false; error: { code: string; message: string } };
      if (!signJson.ok) throw new Error(signJson.error.message);

      const form = new FormData();
      form.append("file", file);
      form.append("api_key", signJson.data.apiKey);
      form.append("timestamp", String(signJson.data.timestamp));
      form.append("folder", signJson.data.folder);
      form.append("signature", signJson.data.signature);

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${signJson.data.cloudName}/auto/upload`,
        { method: "POST", body: form },
      );
      const uploadJson = (await uploadRes.json()) as {
        secure_url?: string;
        url?: string;
        error?: { message?: string };
      };
      if (uploadJson.error) throw new Error(uploadJson.error.message ?? "Upload failed.");
      const url = uploadJson.secure_url ?? uploadJson.url;
      if (!url) throw new Error("No URL returned from Cloudinary.");

      onChange(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await handleFile(file);
    e.target.value = "";
  };

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <div
        className="relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--bg-alt)] text-[var(--ink-soft)]"
        style={{ width: size, height: size }}
        aria-hidden={!value}
      >
        {value ? (
          <Image
            src={value}
            alt={name ? `${name} avatar` : "Your avatar"}
            fill
            sizes={`${size}px`}
            className="object-cover"
          />
        ) : (
          <span className="font-display text-xl font-semibold tracking-[-0.02em]">
            {getInitials(name)}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={onFileChange}
          className="sr-only"
          aria-label="Upload avatar"
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden /> Uploading
              </>
            ) : (
              <>
                <Upload className="size-4" strokeWidth={1.5} aria-hidden /> Change
              </>
            )}
          </Button>
          {value ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => onChange(null)}
              disabled={uploading}
            >
              Remove
            </Button>
          ) : null}
        </div>
        {error ? (
          <p role="alert" aria-live="polite" className="text-xs text-[var(--danger)]">
            {error}
          </p>
        ) : (
          <p className="text-xs text-[var(--muted)]">JPG, PNG, or WebP. Max 5 MB.</p>
        )}
      </div>
    </div>
  );
}

export default AvatarUploader;
