import { Suspense } from "react";
import { Skeleton } from "@/components/Skeleton";
import { UploadDetail } from "@/features/uploads/UploadDetail";
import { parsePage, RESULTS_PAGE_SIZE } from "@/features/uploads/pagination";

interface DetailRouteProps { params: Promise<{ id: string }>; searchParams: Promise<{ page?: string | string[] }>; }
async function DetailRoute({ params, searchParams }: DetailRouteProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  return <UploadDetail id={id} page={parsePage(query.page, RESULTS_PAGE_SIZE)} />;
}
export default function UploadDetailPage(props: DetailRouteProps) {
  return <Suspense fallback={<Skeleton kind="table" />}><DetailRoute {...props} /></Suspense>;
}
