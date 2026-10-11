import { UploadsList } from "@/features/uploads/UploadsList";
import { parsePage } from "@/features/uploads/pagination";
import { Suspense } from "react";
import { Skeleton } from "@/components/Skeleton";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

async function UploadsRoute({ searchParams }: { searchParams: SearchParams }) {
  return <UploadsList page={parsePage((await searchParams).page)} />;
}
export default function UploadsPage({ searchParams }: { searchParams: SearchParams }) {
  return <Suspense fallback={<Skeleton kind="table" />}><UploadsRoute searchParams={searchParams} /></Suspense>;
}
