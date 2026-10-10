## 1. Shared kernel

- [x] 1.1 Either: `left` and `right` with `isLeft`, `isRight` and `value`
- [x] 1.2 Either: `fold`
- [x] 1.3 Either: `map` and `flatMap`
- [x] 1.4 `DomainError` base and the five specific errors with unique codes

## 2. File name

- [x] 2.1 `FileName`: accepted names, trimming and case insensitive extension
- [x] 2.2 `FileName`: rejected names (empty, extension, path, length)
- [x] 2.3 `FileName`: equality by value

## 3. Activity data

- [x] 3.1 `ActivityData`: valid row and trimming
- [x] 3.2 `ActivityData`: rejected fields (category, unit, amount, date)

## 4. Upload status and aggregate

- [x] 4.1 `UploadStatus`: closed set
- [x] 4.2 `Upload.create` and `Upload.reconstitute`
- [x] 4.3 `Upload`: `startProcessing`, including the retry case
- [ ] 4.4 `Upload`: `recordProgress` with its guards
- [ ] 4.5 `Upload`: `complete` with the counter invariant
- [ ] 4.6 `Upload`: `fail`
- [ ] 4.7 `Upload`: terminal states stay unchanged

## 5. Verification

- [ ] 5.1 `bun run typecheck` passes
- [ ] 5.2 `bun run test` passes and coverage is not below the baseline
- [ ] 5.3 No `any`, files under 300 lines, functions under 40 lines
