export interface RowCounts { uploads: number; rows: number; }
export interface CandidateIO { snapshot(): Promise<RowCounts>; apply(): Promise<void>; }
export async function verifyCandidate(io: CandidateIO): Promise<{ before: RowCounts; after: RowCounts }> {
  const before = await io.snapshot();
  await io.apply();
  const after = await io.snapshot();
  if (before.uploads !== after.uploads || before.rows !== after.rows) throw new Error("Candidate DDL changed row counts");
  return { before, after };
}
