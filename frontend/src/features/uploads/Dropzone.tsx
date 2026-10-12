"use client";

import { useId, useRef, useState } from "react";
import { Button } from "@/components/Button";
import { CloudUpload } from "lucide-react";
import { maxUploadMb, validateFile } from "./validateFile";

interface DropzoneProps { file: File | null; onChange(file: File | null): void; disabled?: boolean; limitMb?: number; compact?: boolean; }
function fileSize(bytes: number): string {
  const unit = bytes >= 1024 * 1024 ? "MB" : bytes >= 1024 ? "KB" : "B";
  const divisor = unit === "MB" ? 1024 * 1024 : unit === "KB" ? 1024 : 1;
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(bytes / divisor)} ${unit}`;
}
function useFileChoice(onChange: DropzoneProps["onChange"], limitMb: number, disabled: boolean) {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const choose = (files: File[]): void => {
    if (disabled || !files.length) return;
    const message = files.length > 1 ? "Choose one CSV file at a time." : validateFile(files[0], limitMb);
    setError(message); onChange(message ? null : files[0]);
    if (input.current) input.current.value = "";
  };
  const remove = (): void => { setError(null); onChange(null); if (input.current) input.current.value = ""; };
  return { input, error, choose, remove };
}
export function Dropzone({ file, onChange, disabled = false, limitMb = maxUploadMb(), compact = false }: DropzoneProps) {
  const id = useId();
  const [depth, setDepth] = useState(0);
  const { input, error, choose, remove } = useFileChoice(onChange, limitMb, disabled);
  const compactSelected = compact && file !== null;
  return <section className={compactSelected ? "dropzone-section dropzone-section-compact" : "space-y-4"}>
    <label className={compactSelected ? "dropzone dropzone-compact" : "dropzone"} htmlFor={id} data-dragging={depth > 0 && !disabled} data-disabled={disabled}
      onDragEnter={event => { event.preventDefault(); if (!disabled) setDepth(value => value + 1); }}
      onDragLeave={() => setDepth(value => Math.max(0, value - 1))} onDragOver={event => event.preventDefault()}
      onDrop={event => { event.preventDefault(); setDepth(0); choose(Array.from(event.dataTransfer.files)); }}>
      <input ref={input} id={id} type="file" accept=".csv" className="sr-only" disabled={disabled}
        aria-labelledby={`${id}-title`} aria-describedby={`${compactSelected ? "" : `${id}-hint `}${id}-error`} aria-invalid={Boolean(error)}
        onChange={event => choose(Array.from(event.target.files ?? []))} />
      <span className="dropzone-symbol" aria-hidden="true"><CloudUpload size={compactSelected ? 24 : 32} strokeWidth={1.5} /></span>
      <span id={`${id}-title`} className={compactSelected ? "block text-sm font-semibold" : "block font-display text-[28px]"}>Choose a CSV file</span>
      {!compactSelected && <span className="mt-2 block text-sm text-ink-muted">Or drag and drop it here</span>}
      {!compactSelected && <span id={`${id}-hint`} className="mt-4 block text-xs text-ink-muted">One .csv file, up to {limitMb} MB. Required columns: category, amount, unit, date.</span>}
    </label>
    {file && <div className={compactSelected ? "selected-file selected-file-compact" : "selected-file"}><div className="min-w-0"><p className="break-all font-mono text-sm">{file.name}</p><p className="mt-1 text-xs text-ink-muted">{fileSize(file.size)}</p></div>
      <Button disabled={disabled} onClick={remove}>Remove file</Button></div>}
    <p id={`${id}-error`} role="alert" hidden={!error} className="text-sm text-failed">{error}</p>
  </section>;
}
