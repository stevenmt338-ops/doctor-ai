# DOCTOR AI Security Specification

## 1. Data Invariants
- Every `HealthProfile` at `/users/{userId}/private/{profileId}` belongs strictly to `userId == request.auth.uid`, and `profileId` must be `"profile"`.
- Every `MedicalReport` at `/reports/{reportId}` must contain `userId == request.auth.uid`, immutable `id`, immutable `userId`, and immutable `createdAt` equal to `request.time` on creation.
- Every `UserFeedback` at `/feedback/{feedbackId}` must contain `userId == request.auth.uid`, `rating` between 1 and 5, and bounded comment length.
- All list queries on `/reports` MUST evaluate `resource.data.userId == request.auth.uid`, guaranteeing cross-account isolation even if a malicious client omits `where('userId', '==', uid)`.
- Every write requires verified authentication (`request.auth != null && request.auth.token.email_verified == true`).

## 2. Adversarial Payloads (Dirty Dozen)
1. Cross-account read on `/reports/other_report` by user B -> `PERMISSION_DENIED`.
2. Unfiltered list query on `/reports` without `where('userId', '==', uid)` -> `PERMISSION_DENIED`.
3. Create report with spoofed `userId: "victim_uid"` -> `PERMISSION_DENIED`.
4. Shadow field injection (`isAdmin: true` or `verifiedDiagnosis: true`) on create -> `PERMISSION_DENIED`.
5. Shadow update adding an unexpected key to `/reports/{reportId}` -> `PERMISSION_DENIED`.
6. Modifying immutable `userId` or `createdAt` during report update -> `PERMISSION_DENIED`.
7. Client-forged `createdAt` timestamp not equal to `request.time` -> `PERMISSION_DENIED`.
8. Unverified email (`email_verified: false`) attempting write -> `PERMISSION_DENIED`.
9. Oversized ID (>128 chars or invalid characters) in `/reports/{reportId}` -> `PERMISSION_DENIED`.
10. Oversized `title` (>200 chars) or `messages` (>100 items) -> `PERMISSION_DENIED`.
11. Reading another user's private health profile at `/users/victim_uid/private/profile` -> `PERMISSION_DENIED`.
12. Deleting another user's report at `/reports/other_report` -> `PERMISSION_DENIED`.
