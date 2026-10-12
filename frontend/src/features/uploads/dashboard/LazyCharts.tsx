"use client";

import dynamic from "next/dynamic";

function ChartPlaceholder() { return <div aria-hidden="true" className="chart-placeholder" />; }
export const ActivityChart = dynamic(() => import("./Charts").then(module => module.ActivityChart), { ssr: false, loading: ChartPlaceholder });
export const CompletionDonut = dynamic(() => import("./Charts").then(module => module.CompletionDonut), { ssr: false, loading: ChartPlaceholder });
export const StatusBars = dynamic(() => import("./Charts").then(module => module.StatusBars), { ssr: false, loading: ChartPlaceholder });
export const CompletionGauge = dynamic(() => import("./Charts").then(module => module.CompletionGauge), { ssr: false, loading: ChartPlaceholder });
export const LargestUploadsChart = dynamic(() => import("./LargestUploadsChart").then(module => module.LargestUploadsChart), { ssr: false, loading: ChartPlaceholder });
