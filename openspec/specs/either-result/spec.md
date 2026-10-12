# either-result Specification

## Purpose
Represent success or failure as a value that can be combined and consumed.
## Requirements
### Requirement: Either represents success or failure as a value
The system SHALL provide an `Either<L, R>` type created with `Either.left(error)` or
`Either.right(value)`, and creating either side SHALL NOT throw.

#### Scenario: A right holds a success value
- **WHEN** `Either.right(42)` is created
- **THEN** `isRight()` is true, `isLeft()` is false and `value` is 42

#### Scenario: A left holds a failure
- **WHEN** `Either.left(error)` is created
- **THEN** `isLeft()` is true, `isRight()` is false and `value` is the same error

### Requirement: Either can be consumed with fold
The system SHALL provide `fold(onLeft, onRight)` that calls exactly one of the two functions and
returns its result.

#### Scenario: Fold on a right
- **WHEN** `fold` is called on `Either.right(2)` with a success function that doubles its input
- **THEN** the result is 4 and the failure function is not called

#### Scenario: Fold on a left
- **WHEN** `fold` is called on `Either.left("boom")` with a failure function that wraps the message
- **THEN** the failure function result is returned and the success function is not called

### Requirement: Either can be transformed without unwrapping
The system SHALL provide `map` to transform the success value and `flatMap` to chain steps that can
themselves fail. A `Left` SHALL pass through both operations unchanged.

#### Scenario: Map on a right
- **WHEN** `map` doubles the value of `Either.right(2)`
- **THEN** the result is `Either.right(4)`

#### Scenario: Map on a left
- **WHEN** `map` is called on `Either.left("boom")`
- **THEN** the same left is returned and the function is never called

#### Scenario: FlatMap stops at the first failure
- **WHEN** three chained `flatMap` steps run and the second returns a left
- **THEN** the final result is that left and the third step is never called

