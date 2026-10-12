"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { ApiError } from "@/lib/api/ApiError";
import type { Page, ResultRow, Upload, UploadStats, UploadStatus, UploadListFilters } from "@/lib/api/models";
import { getStats, getUpload, getUploadResults, listUploads } from "@/lib/api/uploads";
import { uploadKeys } from "@/lib/api/uploadKeys";
import { listInterval, statsInterval, uploadInterval } from "./polling";

export function useUploadStats() {
  return useQuery<UploadStats, ApiError>({ queryKey: uploadKeys.stats(), queryFn: getStats,
    refetchInterval: query => statsInterval(query.state.data) });
}
export function useUploads(page: number, limit: number, filters: UploadListFilters = {}) {
  return useQuery<Page<Upload>, ApiError>({ queryKey: uploadKeys.list(page, limit, filters), queryFn: () => listUploads(page, limit, filters),
    placeholderData: keepPreviousData, refetchInterval: query => listInterval(query.state.data) });
}
export function useUploadDetail(id: string) {
  return useQuery<Upload, ApiError>({ queryKey: uploadKeys.detail(id), queryFn: () => getUpload(id), enabled: Boolean(id),
    refetchInterval: query => uploadInterval(query.state.data?.status) });
}
export function useUploadResults(id: string, page: number, limit: number, status?: UploadStatus) {
  return useQuery<Page<ResultRow>, ApiError>({ queryKey: uploadKeys.results(id, page, limit),
    queryFn: () => getUploadResults(id, page, limit), enabled: Boolean(id),
    placeholderData: keepPreviousData, refetchInterval: uploadInterval(status) });
}
