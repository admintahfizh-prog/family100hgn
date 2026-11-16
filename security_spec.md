# Security Specification – Family 100 Special HGN

## 1. Data Invariants
1. Every `/stages/{stageId}` document belongs strictly to one `ownerId` (`stageId == request.auth.uid`) and optionally up to 10 verified co-host Google emails (`allowedEmails`).
2. `ownerId` and `createdAt` are immutable after document creation; `updatedAt` must always equal `request.time`.
3. Only the stage owner (`existing().ownerId == request.auth.uid`) may modify `mcPin`, `allowedEmails`, or delete the stage.
4. Every `/stages/{stageId}/matches/{matchId}` record verifies parent authorization via `get()` on `/stages/{stageId}`, binds `stageId` to the path variable, binds `ownerId == request.auth.uid`, and enforces strict string lengths and integer score ranges.
5. Unauthenticated requests and unverified email accounts (`email_verified != true`) are denied across all reads and writes.

## 2. Dirty Dozen Payloads (Must Return PERMISSION_DENIED)
1. Unauthenticated `get`/`create`/`update` on `/stages/{stageId}`.
2. Creating `/stages/other-id` where `stageId != request.auth.uid`.
3. Creating a stage with `ownerId` spoofed to another user's UID.
4. Shadow field injection (`isAdmin: true`) during stage creation or update.
5. Oversized `mcPin` (`"1234567890"`) or non-numeric `mcPin` (`"abcd"`).
6. Mutating immutable `ownerId` or `createdAt` during stage update.
7. Client-forged `updatedAt` timestamp not equal to `request.time`.
8. Co-host trying to overwrite `mcPin` or `allowedEmails` (owner-only action).
9. Blanket `list` query on `/stages` without scoping to `ownerId` or `allowedEmails`.
10. Resource poisoning with >80 char team name or >10 items in `allowedEmails`.
11. Creating a `MatchRecord` under a stage where the caller is neither owner nor co-host.
12. Creating a `MatchRecord` with `stageId` mismatched from the parent path or negative score.
