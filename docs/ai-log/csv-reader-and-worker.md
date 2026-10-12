# CSV reader and worker AI usage

Date: 2026-10-11

- Replaced FsFileStorage.open with guarded createReadStream iteration before any other task;
  saved bytes, multi-megabyte chunking, traversal and missing-file behavior passed real FS tests.
- Added the only approved dependency, csv-parse ^7.0.3, after Context7 and installed-type checks.
  Options include bom, relax_column_count, skip_empty_lines, max_record_size and info.
- Reproduced Info.lines ending-line behavior and quoted-CRLF double counting: physical lines
  [1,2,4] were reported [1,4,5]. The reader now counts CRLF/CR/LF in raw snapshots and uses
  the empty_lines delta for skipped prefixes. Tests cover LF/CRLF multiline, escaped quotes,
  a closing quote on a separate line, absent final newline and leading/inter-record empty lines.
  The real mixed fixture produced 15 valid and 10 rejected at all EXPECTED.md lines, including CRLF line6.
- Syntax/size errors become MalformedCsvError with a safe generic message, never raw CsvError
  text. Upstream IO errors retain identity. Pipeline destruction and awaiting completion close
  resources on normal completion, errors and early consumer exit.
- Added ILogger/JSON adapter; cleanup Left/throw logs fixed text with uploadId/key and preserves
  persistence failure. Worker messages use correlation ids/outcomes, never raw errors or tokens.
- Summary receives the true rejection count and the handler retains only its first ten details;
  recordProgress Either is explicitly discarded after a successful fenced write of local valid counts.
- Worker.runOnce handles idle, success, stale, transient/permanent failure and queue outages.
  The loop uses injected abortable waits, cooldown after queue throws and completes an active job
  on shutdown. Composition uses real adapters, SystemClock and randomUUID; no runtime script change.
- Real-adapter E2E: 60/60 valid, mixed25 with15 valid10 rejected, bad-header FAILED/DONE,
  bad-quote FAILED/DEAD after one attempt, 5000 rows with committed progress500..5000,
  a paused writer reclaimed after an injected-clock advance with no duplicates, and two workers
  processing two uploads once each. No concurrency sleeps or mocked database writes were used.
- Real bun run worker smoke printed started/processed/stopped; SIGTERM returned code0, signalnull.
  Database result was COMPLETED, processedRows1, jobDONE, attempts1. Integration coverage runners
  were kept sequential. Tests that already passed were identified as regression verification, not fake REDs.
- Baseline213 unit/59 integration; final259 unit/72 integration. Unit coverage99/99.49/98.4/98.77
  versus98.72/99.39/98.03/98.45 (statements/branches/functions/lines). Typecheck and OpenSpec passed.
- Found an exception to the proposed raw-memory bound: 2000 blank-prefix newlines gave raw2026
  despite max_record_size64. The approved decision is no extra reader guard; HTTP/M5 must enforce
  MAX_UPLOAD_MB (default10 MB). RAM is proportional to the file cap plus buffers/copies/match arrays,
  not guaranteed to be10 MB. Direct internal callers are not currently size-capped by the reader.
- Security scan reported zero issues; its generated policy artifact was inspected and removed.
  No push or archive. Only csv-parse was added; existing versions and frontend remain unchanged.
