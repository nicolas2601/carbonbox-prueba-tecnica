## ADDED Requirements

### Requirement: Saving writes the stream under a generated key
The system SHALL provide `FsFileStorage` implementing `IFileStorage`. `save(stream)` SHALL write
all bytes to `<STORAGE_DIR>/<generated id>.csv`, creating the directory if it does not exist,
and SHALL return the key `<generated id>.csv` as a right.

#### Scenario: Saving a stream
- **WHEN** a stream with the bytes of a small CSV is saved
- **THEN** the result is a right with a key ending in `.csv` and the file content equals the bytes

#### Scenario: Missing directory is created
- **WHEN** the storage directory does not exist before the first save
- **THEN** the save succeeds and the directory exists afterwards

#### Scenario: Keys are unique
- **WHEN** two streams are saved
- **THEN** the two keys differ

### Requirement: A failed write leaves nothing behind
The system SHALL write to a temporary name and rename it on success. If the stream fails
midway, `save` SHALL return a left `StorageFailureError` and no file SHALL remain under the
final key or the temporary name.

#### Scenario: The stream errors midway
- **WHEN** a stream yields some bytes and then throws
- **THEN** the result is a left `StorageFailureError` and the storage directory has no files

### Requirement: Deleting removes the file and is idempotent
The system SHALL remove the file for a key on `delete(key)` and SHALL return a right also when
the file does not exist.

#### Scenario: Deleting an existing file
- **WHEN** a saved key is deleted
- **THEN** the result is a right and the file no longer exists

#### Scenario: Deleting a missing key
- **WHEN** a key that was never saved is deleted
- **THEN** the result is a right

### Requirement: Keys cannot escape the storage directory
The system SHALL return a left `StorageFailureError` from `delete` for keys containing a path
separator or `..`, and SHALL NOT touch any file.

#### Scenario: A traversal key
- **WHEN** `delete("../secret.csv")` or `delete("a/b.csv")` is called
- **THEN** the result is a left and a file outside the directory still exists
