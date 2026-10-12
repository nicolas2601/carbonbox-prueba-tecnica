import { UploadsList } from "@/features/uploads/UploadsList";
import { parsePage } from "@/features/uploads/pagination";
import { Suspense } from "react";
import { Skeleton } from "@/components/Skeleton";
import { filtersFromSearchParams } from "@/features/uploads/listFilters";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

async function UploadsRoute({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  return <UploadsList page={parsePage(params.page)} filters={filtersFromSearchParams(params)} />;
}
export default function UploadsPage({ searchParams }: { searchParams: SearchParams }) {
  return <Suspense fallback={<Skeleton kind="table" />}><UploadsRoute searchParams={searchParams} /></Suspense>;
}
