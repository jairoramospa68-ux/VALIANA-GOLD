# Security Specification — VALIANA GOLD Firestore

## 1. Data Invariants
1. Every document in `/products/{productId}` has a valid ID matching `^[a-zA-Z0-9_\-]+$` (`1..128` chars) equal to `data.id`.
2. Public visitors (unauthenticated) may read `/products` (`get`, `list`) to browse the storefront catalog. Only non-PII catalog metadata is stored in `/products`.
3. Only verified administrators (`isAdmin()`, requiring `request.auth != null && request.auth.token.email_verified == true` and matching bootstrap email `jairoramospa68@gmail.com` or `/admins/{uid}`) can create, update, or delete `/products/{productId}`.
4. `createdAt` and `updatedAt` are server timestamps (`request.time`), with `createdAt` and `id` immutable after creation.
5. Every string and numeric field has explicit type and boundary limits (`image.size() <= 350000` so every document stays well below Firestore's 1MB limit).
6. `/admins/{adminId}` and `/authorizedAdmins/{emailKey}` contain admin emails (PII) and are strictly restricted: only the bootstrap admin or the matching signed-in verified user can `get`, only the bootstrap admin can `list`, `create`, or `delete`, and self-privilege escalation is blocked.
7. `/adminSecurity/pin` stores only a randomly salted SHA-256 hash (`salt`, `pinHash`), readable and writable exclusively by verified `isAdmin()` users (`list` denied, `delete` restricted to `isBootstrapAdmin()`).

## 2. Dirty Dozen Attack Payloads (All Must Fail with PERMISSION_DENIED)
1. **Unauthenticated Product Create**: Anonymous visitor tries `setDoc(doc(db, 'products', 'fake-1'), validPayload)`.
2. **Non-Admin Signed-In User Product Update**: Verified Google user (`other@gmail.com`) tries `updateDoc(doc(db, 'products', 'val-01'), { price: 1 })`.
3. **Unverified Email Spoof**: Account with `email == 'jairoramospa68@gmail.com'` and `email_verified: false` tries to create/update a product.
4. **Shadow / Ghost Field Injection**: Admin tries to create or update a product with extra field `isFeaturedHack: true`.
5. **Immutable Field Tampering**: Admin tries to overwrite `id` or `createdAt` on an existing product during `update`.
6. **Client-Forged Timestamp**: Admin sends a client `Date` instead of `serverTimestamp()` (`request.time`) in `createdAt` or `updatedAt`.
7. **Oversized Image / Resource Exhaustion**: Admin tries to write an `image` string larger than `350000` bytes.
8. **Negative Price / Stock Poisoning**: Admin sends `price: -5000` or `stock: -3`.
9. **Invalid Category Enum**: Admin sends `category: 'InvalidCategory'` outside the allowlist.
10. **ID Poisoning**: Write to `/products/bad$id` or an ID exceeding 128 chars.
11. **PII Snooping on `/admins`**: Non-bootstrap user tries to `list` `/admins` or `get` another user's `/admins/{otherUid}` document.
12. **Self-Assigned Admin Escalation**: Non-bootstrap user tries `setDoc(doc(db, 'admins', myUid), { uid: myUid, email: myEmail, role: 'admin', createdAt: serverTimestamp() })`.
