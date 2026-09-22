"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, Trash2 } from "lucide-react";
import { updateProfile } from "@/lib/actions/account";
import { uploadToBucket, removeFromBucket } from "@/lib/upload";
import { Avatar } from "@/components/ui/Avatar";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { errorMessage } from "@/lib/utils";

type Props = { initial: { display_name: string; bio: string | null; avatar_path: string | null } };

export function ProfileForm({ initial }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [displayName, setDisplayName] = useState(initial.display_name);
  const [bio, setBio] = useState(initial.bio ?? "");
  const [avatarPath, setAvatarPath] = useState<string | null>(initial.avatar_path);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const onPickAvatar = async (file: File | undefined) => {
    if (!file) return;
    setMessage(null);
    setUploading(true);
    try {
      const previous = avatarPath;
      const res = await uploadToBucket("memorial-avatars", file, { maxEdge: 512 });
      setAvatarPath(res.path);
      if (previous && previous !== res.path) void removeFromBucket(previous);
    } catch (e) {
      setMessage({ kind: "error", text: errorMessage(e) });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const res = await updateProfile({ display_name: displayName, bio, avatar_path: avatarPath });
      if (!res.ok) {
        setMessage({ kind: "error", text: res.error });
        return;
      }
      setMessage({ kind: "success", text: "Your profile has been saved." });
      router.refresh();
    });
  };

  return (
    <form onSubmit={onSubmit} className="card space-y-6 p-6" aria-describedby="profile-help">
      <p id="profile-help" className="text-sm text-ivory-400">
        Your name and photo appear beside the memories you share and the memorials you care for.
      </p>

      <div className="flex items-center gap-5">
        <Avatar path={avatarPath} name={displayName || "You"} size={80} />
        <div className="flex flex-wrap gap-2">
          <label className="btn-secondary cursor-pointer px-4 py-2 text-xs">
            {uploading ? <Spinner className="h-3.5 w-3.5" /> : <Camera size={14} aria-hidden />} {avatarPath ? "Change photo" : "Add a photo"}
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => onPickAvatar(e.target.files?.[0])} disabled={uploading} />
          </label>
          {avatarPath && (
            <button type="button" className="btn-ghost px-4 py-2 text-xs" onClick={() => setAvatarPath(null)} disabled={uploading}>
              <Trash2 size={14} aria-hidden /> Remove
            </button>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="display_name" className="label">
          Display name
        </label>
        <input id="display_name" name="display_name" className="input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required minLength={2} maxLength={80} autoComplete="name" />
      </div>

      <div>
        <label htmlFor="bio" className="label">
          About you <span className="normal-case tracking-normal text-ivory-500">(optional)</span>
        </label>
        <textarea id="bio" name="bio" className="input min-h-28 resize-y" value={bio} onChange={(e) => setBio(e.target.value)} maxLength={600} placeholder="A sentence or two, if you like." />
        <p className="mt-1 text-right text-xs text-ivory-500">{bio.length}/600</p>
      </div>

      {message && <Alert kind={message.kind}>{message.text}</Alert>}

      <div className="flex justify-end">
        <button type="submit" className="btn-primary" disabled={pending || uploading}>
          {pending ? <Spinner className="h-4 w-4 border-navy-900/40 border-t-navy-900" /> : "Save changes"}
        </button>
      </div>
    </form>
  );
}
