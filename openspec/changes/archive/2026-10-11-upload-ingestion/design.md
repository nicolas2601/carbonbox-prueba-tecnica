## Decisions

### One port saves the upload and its job together
`IUploadRepository.saveWithJob(upload, job)` must store both or neither. The requirement
"never a job without an upload, never an upload that is never queued" is a property of the
persistence step, so it belongs to one port method and is implemented with one database
transaction later. Alternative rejected: separate `save` and `publish` calls, which leave a
window where one succeeds and the other fails.

### File first, database second
The stored key is part of the `Upload` (`fileUrl`), so the file is stored before the upload is
created. If the database step fails, the handler deletes the stored file (compensation). The
reverse order would create an upload pointing at a file that may not exist.

### Compensation is best effort
If deleting the file also fails, the original persistence error is still returned; the orphan
file is accepted and listed as a known limitation. A cleanup job is out of scope.

### Expected failures are values, unexpected ones are exceptions
Ports return `Either` for failures the caller can name (storage full, constraint violation).
A bug or a lost connection throws and reaches the central error handler of the API.

### Ids and time are injected
`IIdGenerator` and `IClock` make the handler deterministic in tests. The file name is
validated by the `FileName` value object, so the handler holds no extension logic.

### The job carries only the upload id
The worker loads the upload to know the file key. A small payload cannot go stale.

## Risks

- Orphan files when the process dies between the two steps. Accepted, documented.
- The size limit is enforced where the stream is read (HTTP layer), not in this handler.
