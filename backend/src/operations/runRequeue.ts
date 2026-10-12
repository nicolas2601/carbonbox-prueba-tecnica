import type { RequeueDeadJob } from "../document-processing/application/operations/RequeueDeadJob";

export async function runRequeue(args: string[], handler: Pick<RequeueDeadJob, "execute">,
  write: (line: string) => void): Promise<number> {
  if (args.length !== 1) {
    write("Usage: job:requeue <uploadId>");
    return 2;
  }
  const result = await handler.execute(args[0]!);
  if (result.isLeft()) {
    write(JSON.stringify({ status: "refused", code: result.value.code }));
    return 1;
  }
  write(JSON.stringify({ status: "queued", ...result.value }));
  return 0;
}
