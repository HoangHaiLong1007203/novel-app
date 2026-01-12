"use client";

import { useRef, type ChangeEvent } from "react";
import { Camera, Loader2 } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage, Button } from "@/components/ui";
import { cn } from "@/lib/utils";

export interface ProfileAvatarUploaderProps {
  avatarUrl?: string | null;
  previewUrl?: string | null;
  username?: string | null;
  isUploading?: boolean;
  helperText?: string;
  className?: string;
  onSelectFile: (file: File) => void | Promise<void>;
}

export function ProfileAvatarUploader({
  avatarUrl,
  previewUrl,
  username,
  isUploading = false,
  helperText = "PNG, JPG hoặc WEBP. Tối đa 5MB.",
  className,
  onSelectFile,
}: ProfileAvatarUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handlePick = () => fileInputRef.current?.click();

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    onSelectFile(file);
    event.target.value = "";
  };

  const initials = username?.trim().slice(0, 2).toUpperCase() || "??";
  const imageSource = previewUrl || avatarUrl || undefined;

  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-center", className)}>
      <Avatar className="size-24 border-2 border-muted-foreground/20 bg-muted shadow-inner">
        <AvatarImage src={imageSource} alt={`Avatar của ${username ?? "bạn"}`} />
        <AvatarFallback className="text-lg font-semibold uppercase">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="space-y-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-fit gap-2"
          onClick={handlePick}
          disabled={isUploading}
        >
          {isUploading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Camera className="size-4" />
          )}
          {isUploading ? "Đang cập nhật" : "Đổi avatar"}
        </Button>
        <p className="text-xs text-muted-foreground">{helperText}</p>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}

export default ProfileAvatarUploader;
