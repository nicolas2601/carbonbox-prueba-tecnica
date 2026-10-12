const BYTES_PER_MB = 1024 * 1024;
const DEFAULT_UPLOAD_MB = 10;

export function maxUploadMb(value = process.env.NEXT_PUBLIC_MAX_UPLOAD_MB): number {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 && Number.isSafeInteger(parsed * BYTES_PER_MB) ? parsed : DEFAULT_UPLOAD_MB;
}
export function validateFile(file: Pick<File, "name" | "size">, limitMb = maxUploadMb()): string | null {
  if (!file.name.trim().toLowerCase().endsWith(".csv")) return "Only .csv files are accepted. Choose a file ending in .csv.";
  if (file.size === 0) return "This file is empty. Choose a CSV file with data.";
  if (file.size > limitMb * BYTES_PER_MB) return `File must be ${limitMb} MB or smaller. Choose a smaller CSV file.`;
  return null;
}
