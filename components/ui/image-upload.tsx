"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Upload, X, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  folder?: string;
  className?: string;
  aspectRatio?: "square" | "video" | "wide";
  disabled?: boolean;
}

export function ImageUpload({
  value,
  onChange,
  folder = "uploads",
  className,
  aspectRatio = "square",
  disabled = false,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const aspectRatioClass = {
    square: "aspect-square",
    video: "aspect-video",
    wide: "aspect-[3/1]",
  }[aspectRatio];

  const handleUpload = useCallback(
    async (file: File) => {
      if (disabled) return;

      // Validate file type
      const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
      if (!validTypes.includes(file.type)) {
        setError("Format invalide. Utilisez JPG, PNG, WebP ou GIF.");
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError("Image trop grande. Maximum 5MB.");
        return;
      }

      setError(null);
      setIsUploading(true);

      try {
        // Generate unique filename
        const fileExt = file.name.split(".").pop();
        const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

        // Upload to Supabase Storage
        const { data, error: uploadError } = await supabase.storage
          .from("images")
          .upload(fileName, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          throw uploadError;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from("images")
          .getPublicUrl(data.path);

        onChange(urlData.publicUrl);
      } catch (err) {
        console.error("Upload error:", err);
        setError("Échec du téléchargement. Réessayez.");
      } finally {
        setIsUploading(false);
      }
    },
    [supabase, folder, onChange, disabled]
  );

  const handleDelete = useCallback(async () => {
    if (disabled || !value) return;

    try {
      // Extract path from URL
      const url = new URL(value);
      const pathParts = url.pathname.split("/storage/v1/object/public/images/");
      if (pathParts.length > 1) {
        const filePath = pathParts[1];
        await supabase.storage.from("images").remove([filePath]);
      }
    } catch (err) {
      console.error("Delete error:", err);
    }

    onChange(null);
  }, [supabase, value, onChange, disabled]);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) {
        setIsDragging(true);
      }
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (disabled) return;

      const file = e.dataTransfer.files[0];
      if (file) {
        handleUpload(file);
      }
    },
    [handleUpload, disabled]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleUpload(file);
      }
      // Reset input so same file can be selected again
      e.target.value = "";
    },
    [handleUpload]
  );

  return (
    <div className={cn("relative", className)}>
      {value ? (
        // Image Preview
        <div className={cn("relative overflow-hidden rounded-lg border bg-muted", aspectRatioClass)}>
          <img
            src={value}
            alt="Uploaded"
            className="h-full w-full object-cover"
          />
          {!disabled && (
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity hover:opacity-100">
              <label className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white text-gray-700 transition-transform hover:scale-110">
                <Upload className="h-5 w-5" />
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={disabled || isUploading}
                />
              </label>
              <button
                type="button"
                onClick={handleDelete}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500 text-white transition-transform hover:scale-110"
                disabled={disabled}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
          )}
        </div>
      ) : (
        // Upload Area
        <label
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors",
            aspectRatioClass,
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
            disabled && "cursor-not-allowed opacity-50"
          )}
        >
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled || isUploading}
          />
          {isUploading ? (
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
          ) : (
            <>
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                Glissez une image ou cliquez
              </p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                JPG, PNG, WebP • Max 5MB
              </p>
            </>
          )}
        </label>
      )}

      {error && (
        <p className="mt-2 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
