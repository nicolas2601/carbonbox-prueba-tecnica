# http-hardening Specification

## Purpose
Apply security headers, rate limiting and a strict CORS policy.
## Requirements
### Requirement: Security headers
The system SHALL send standard security headers on every API response and the frontend SHALL send a content security policy and the equivalent headers.

#### Scenario: API headers
- **WHEN** any API endpoint is requested
- **THEN** the response has `x-content-type-options: nosniff` and does not expose the server technology

#### Scenario: Frontend headers
- **WHEN** a frontend page is requested
- **THEN** the response has a content security policy and frame protection

### Requirement: Rate limiting with the standard error
The system SHALL limit requests per client, with a tighter limit for the upload endpoint, configurable by environment, answering 429 with the standard error envelope and a `retry-after` header.

#### Scenario: Normal use
- **WHEN** a client makes the requests of a normal session
- **THEN** none is limited

#### Scenario: Abuse
- **WHEN** a client sends more uploads per minute than the limit
- **THEN** the excess requests answer 429 with code `RATE_LIMITED` and `retry-after`

### Requirement: CORS is strict
The system SHALL allow only the configured origins, methods and headers, and reject others without error details.

#### Scenario: Unknown origin
- **WHEN** a preflight request comes from an origin that is not configured
- **THEN** no allow origin header is returned

### Requirement: Every public API response carries a request id
The public HTTP API SHALL return the request id in the `x-request-id` header and accept a bounded valid ASCII id from the client, and logs of the request SHALL include it. This does not apply to the separate private metrics listener or frontend page responses.

#### Scenario: Header
- **WHEN** a request is made to the public API
- **THEN** the response has `x-request-id` equal to the id in the log line of that request

