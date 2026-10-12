import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

// Adapted from shadcn/ui (MIT). Callers own the labelled scroll region.
export function Table({ className, ...props }: ComponentProps<"table">) {
  return <table data-slot="table" className={cn("carbon-table", className)} {...props} />;
}
export function TableHeader(props: ComponentProps<"thead">) {
  return <thead data-slot="table-header" {...props} />;
}
export function TableBody(props: ComponentProps<"tbody">) {
  return <tbody data-slot="table-body" {...props} />;
}
export function TableFooter(props: ComponentProps<"tfoot">) {
  return <tfoot data-slot="table-footer" {...props} />;
}
export function TableRow(props: ComponentProps<"tr">) {
  return <tr data-slot="table-row" {...props} />;
}
export function TableHead(props: ComponentProps<"th">) {
  return <th data-slot="table-head" {...props} />;
}
export function TableCell(props: ComponentProps<"td">) {
  return <td data-slot="table-cell" {...props} />;
}
export function TableCaption(props: ComponentProps<"caption">) {
  return <caption data-slot="table-caption" {...props} />;
}
