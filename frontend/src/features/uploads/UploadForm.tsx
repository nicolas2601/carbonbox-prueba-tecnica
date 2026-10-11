"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/Button";
import { ProgressBar } from "@/components/ProgressBar";
import { ErrorState } from "@/components/ErrorState";
import { Dropzone } from "./Dropzone";
import { useUploadAction, type Uploader } from "./useUploadAction";

export function UploadForm({ uploader }: { uploader?: Uploader }) {
  const [file, setFile] = useState<File | null>(null);
  const { mutation, progress, cancel, upload } = useUploadAction(uploader);
  return <div className="space-y-10">
    <header><Link href="/uploads" className="back-link">Back to uploads</Link>
      <h1 className="page-title font-display mt-4">Upload an activity file</h1>
      <p className="mt-3 text-sm text-ink-muted">Choose your CSV. We&apos;ll check every row and keep the valid data.</p></header>
    <div className="upload-form space-y-6">
      <Dropzone file={file} onChange={next => { mutation.reset(); setFile(next); }} disabled={mutation.isPending} />
      {mutation.isPending && <ProgressBar label={progress === 100 ? "Finishing" : "Uploading"} value={progress} />}
      {mutation.error && mutation.error.code !== "CANCELLED" && <ErrorState title="We couldn't upload this file" error={mutation.error} onRetry={() => { if (file) upload(file); }} />}
      <div className="flex flex-wrap gap-3">
        <Button tone="primary" disabled={!file || mutation.isPending} onClick={() => { if (file) upload(file); }}>Upload file</Button>
        {mutation.isPending && <Button disabled={progress >= 100} onClick={cancel}>Cancel upload</Button>}
      </div>
    </div>
  </div>;
}
