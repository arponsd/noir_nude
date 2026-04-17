"use client";

import * as React from "react";
import { ImagePlus, Loader2, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { UploadFolder, UploadSign } from "@/types/api/uploads";

export interface UploadedImage {
  url: string;
  alt: string;
  order: number;
}

interface CloudinaryUploaderProps {
  images: UploadedImage[];
  onChange: (next: UploadedImage[]) => void;
  folder?: UploadFolder;
}

type UrlPasteForm = {
  url: string;
  alt: string;
};

export default function CloudinaryUploader({
  images,
  onChange,
  folder = "products",
}: CloudinaryUploaderProps) {
  const [isUploading, setIsUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [manual, setManual] = React.useState<UrlPasteForm>({ url: "", alt: "" });

  const handleFile = async (file: File) => {
    setIsUploading(true);
    setError(null);
    try {
      const signRes = await fetch("/api/uploads/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder }),
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

      onChange([...images, { url, alt: file.name, order: images.length }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await handleFile(file);
    e.target.value = "";
  };

  const addManualUrl = () => {
    if (!manual.url.trim()) return;
    onChange([
      ...images,
      {
        url: manual.url.trim(),
        alt: manual.alt.trim(),
        order: images.length,
      },
    ]);
    setManual({ url: "", alt: "" });
  };

  const remove = (idx: number) => {
    const next = images.filter((_, i) => i !== idx).map((img, i) => ({ ...img, order: i }));
    onChange(next);
  };

  const updateAlt = (idx: number, alt: string) => {
    const next = images.map((img, i) => (i === idx ? { ...img, alt } : img));
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="relative inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-[var(--line)] bg-[var(--surface)] px-4 text-sm text-[var(--ink)] transition-colors focus-within:ring-2 focus-within:ring-[var(--accent)] focus-within:ring-offset-2 hover:bg-[var(--bg-alt)]">
          {isUploading ? (
            <Loader2 className="size-4 animate-spin" strokeWidth={1.5} aria-hidden />
          ) : (
            <ImagePlus className="size-4" strokeWidth={1.5} aria-hidden />
          )}
          Upload image
          <input
            type="file"
            accept="image/*"
            onChange={onFileChange}
            className="sr-only"
            disabled={isUploading}
          />
        </label>
        <div className="flex flex-1 flex-wrap items-end gap-2">
          <div className="min-w-[220px] flex-1">
            <Label htmlFor="manual-url" className="text-xs">
              Or paste URL
            </Label>
            <Input
              id="manual-url"
              value={manual.url}
              onChange={(e) => setManual((m) => ({ ...m, url: e.target.value }))}
              placeholder="https://..."
            />
          </div>
          <div className="min-w-[160px] flex-1">
            <Label htmlFor="manual-alt" className="text-xs">
              Alt text
            </Label>
            <Input
              id="manual-alt"
              value={manual.alt}
              onChange={(e) => setManual((m) => ({ ...m, alt: e.target.value }))}
            />
          </div>
          <Button type="button" size="sm" variant="secondary" onClick={addManualUrl}>
            Add URL
          </Button>
        </div>
      </div>

      {error ? (
        <p className="flex items-center gap-2 text-sm text-[var(--danger)]">
          <X className="size-4" strokeWidth={1.5} aria-hidden /> {error}
        </p>
      ) : null}

      {images.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {images.map((img, idx) => (
            <li
              key={`${img.url}-${idx}`}
              className="flex flex-col gap-2 rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] p-2"
            >
              <div
                className="aspect-square w-full rounded-[var(--radius-sm)] bg-[var(--bg-alt)] bg-cover bg-center"
                style={{ backgroundImage: `url(${img.url})` }}
                role="img"
                aria-label={img.alt || "Product image"}
              />
              <Input
                aria-label={`Alt text for image ${idx + 1}`}
                value={img.alt}
                onChange={(e) => updateAlt(idx, e.target.value)}
                className="h-8 text-xs"
                placeholder="Alt text"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => remove(idx)}
                aria-label={`Remove image ${idx + 1}`}
              >
                <Trash2 className="size-3.5" strokeWidth={1.5} aria-hidden />
                Remove
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-[var(--muted)]">No images yet. Upload at least one.</p>
      )}
    </div>
  );
}
