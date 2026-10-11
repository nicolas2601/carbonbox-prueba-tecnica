"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ApiError } from "@/lib/api/ApiError";
import type { CreatedUpload } from "@/lib/api/models";
import { createUpload } from "@/lib/api/uploads";
import { uploadKeys } from "@/lib/api/uploadKeys";

export type Uploader = typeof createUpload;

async function transfer(file: File, uploader: Uploader, controller: AbortController, update: (percent: number) => void): Promise<CreatedUpload> {
  const result = await uploader(file, percent => { if (!controller.signal.aborted) update(percent); }, controller.signal);
  if (controller.signal.aborted) throw new ApiError("CANCELLED", "Upload canceled", 0);
  return result;
}
export function useUploadAction(uploader: Uploader = createUpload) {
  const client = useQueryClient();
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const active = useRef<AbortController | null>(null);
  useEffect(() => () => active.current?.abort(), []);
  const mutation = useMutation<CreatedUpload, ApiError, File>({
    mutationFn: async file => {
      const controller = new AbortController(); active.current = controller; setProgress(0);
      try { return await transfer(file, uploader, controller, setProgress); }
      finally { if (active.current === controller) active.current = null; }
    },
    onSuccess: async result => {
      await client.invalidateQueries({ queryKey: uploadKeys.all });
      router.push(`/uploads/${encodeURIComponent(result.id)}`);
    },
  });
  const cancel = (): void => { active.current?.abort(); mutation.reset(); setProgress(0); };
  const upload = (file: File): void => { if (!active.current) mutation.mutate(file); };
  return { mutation, progress, cancel, upload };
}
