"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ApiError } from "@/lib/api/ApiError";
import type { CreatedUpload } from "@/lib/api/models";
import { createUpload } from "@/lib/api/uploads";
import { uploadKeys } from "@/lib/api/uploadKeys";

export type Uploader = typeof createUpload;

export function useUploadAction(uploader: Uploader = createUpload) {
  const client = useQueryClient();
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const mutation = useMutation<CreatedUpload, ApiError, File>({
    mutationFn: file => { setProgress(0); return uploader(file, setProgress); },
    onSuccess: async result => {
      await client.invalidateQueries({ queryKey: uploadKeys.all });
      router.push(`/uploads/${encodeURIComponent(result.id)}`);
    },
  });
  return { mutation, progress };
}
