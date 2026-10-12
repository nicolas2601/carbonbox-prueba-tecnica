import type { Pool } from "pg";

export const SEED_UPLOADS = 10000;
export const ROWS_PER_SEED_UPLOAD = 10;
const ANCHOR = "2024-10-12T00:00:00.000Z";
export async function assertDatabase(pool: Pool, name: string): Promise<void> {
  const actual = await pool.query<{ database: string }>("SELECT current_database() AS database");
  if (actual.rows[0]?.database !== name) throw new Error("Unexpected performance database");
}
export async function seed(pool: Pool, name: string): Promise<void> {
  await assertDatabase(pool, name);
  await pool.query(`INSERT INTO uploads (id,"fileName","fileUrl",status,"userId","totalRows","processedRows","failedRows","createdAt","updatedAt")
    SELECT 'seed-upload-' || i, 'seed-' || i || '.csv', 'benchmark-seed', 'COMPLETED', 'benchmark', $3, $3, 0,
    $1::timestamp - i * INTERVAL '1 second', $1::timestamp FROM generate_series(1,$2::int) AS i`, [ANCHOR, SEED_UPLOADS, ROWS_PER_SEED_UPLOAD]);
  await pool.query(`INSERT INTO activity_data (id,"uploadId",category,amount,unit,date,"createdAt")
    SELECT 'seed-row-' || i, 'seed-upload-' || (1 + (i-1)/$2::int), 'Energy', 1, 'kWh',
    $1::timestamp + (i % 365) * INTERVAL '1 day', $1::timestamp FROM generate_series(1,$3::int) AS i`, [ANCHOR, ROWS_PER_SEED_UPLOAD, SEED_UPLOADS * ROWS_PER_SEED_UPLOAD]);
  await pool.query("ANALYZE uploads"); await pool.query("ANALYZE activity_data");
}
export async function plans(pool: Pool, uploadId: string): Promise<Record<string, unknown>> {
  const queries = {
    list: ['SELECT id,"fileName",status,"totalRows","processedRows","failedRows","errorMessage","createdAt","updatedAt" FROM uploads ORDER BY "createdAt" DESC,id ASC LIMIT 10', []],
    listDeep: ['SELECT id,"fileName",status,"totalRows","processedRows","failedRows","errorMessage","createdAt","updatedAt" FROM uploads ORDER BY "createdAt" DESC,id ASC LIMIT 10 OFFSET 9990', []],
    stats: ['SELECT status,COUNT(*) FROM uploads GROUP BY status', []],
    results: ['SELECT category,amount,unit,date FROM activity_data WHERE "uploadId"=$1 ORDER BY date ASC,id ASC LIMIT 25', [uploadId]],
    resultsDeep: ['SELECT category,amount,unit,date FROM activity_data WHERE "uploadId"=$1 ORDER BY date ASC,id ASC LIMIT 25 OFFSET 4975', [uploadId]],
  } as const;
  const entries: [string, unknown][] = [];
  for (const [label, [sql, values]] of Object.entries(queries)) {
    const result = await pool.query<Record<string, unknown>>(`EXPLAIN (ANALYZE,BUFFERS,FORMAT JSON) ${sql}`, [...values]);
    entries.push([label, result.rows[0]?.["QUERY PLAN"]]);
  }
  return Object.fromEntries(entries);
}
