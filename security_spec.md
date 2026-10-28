# Security Specification & Test Protocol

## 1. Data Invariants
1. **Teacher Data Isolation**: All pedagogical records (students, attendance, grades, classes, curricular units, audit logs) belong strictly to `/users/{userId}/...` subcollections where `userId == request.auth.uid`. A teacher CANNOT read, write, update, or delete any record outside their own subcollection.
2. **Strict Identity Integrity**: In `/users/{userId}`, `userId` must strictly equal `request.auth.uid`. A non-admin cannot alter another user's profile, elevation status, role, or authorization flag.
3. **Admin Privilege Guard**: Only an admin (verified via `/admins/{adminId}` or runtime bootstrapped email `fernandoconselho@gmail.com`) can list user profiles or update administrative authorization status.
4. **Immutable Email**: The email field on a teacher's profile cannot be altered by the teacher after creation. Only admins can update user emails or authorization statuses.
5. **No Cross-Teacher Contamination**: Inquiries by Teacher A for `/users/teacherB/students` must be rejected with `PERMISSION_DENIED`.
6. **Defensive Schema**: All IDs must be valid strings (`size() <= 128`), and strings/maps must not exceed payload limits to prevent Denial of Wallet resource exhaustion.
7. **Default Deny**: Any unmatched paths or anonymous access attempts are denied by default.

---

## 2. The "Dirty Dozen" Adversarial Payloads
Below are 12 specific payloads crafted to probe vulnerabilities:

1. **Payload 1 - Cross-User Student Access (Identity Spoofing)**:
   - Attacker Auth UID: `prof_attacker_123`
   - Target Document: `/users/prof_victim_456/students/stud_01`
   - Operation: `GET` / `LIST`
   - Expected Result: `PERMISSION_DENIED`

2. **Payload 2 - Cross-User Student Injection (Unauthorized Write)**:
   - Attacker Auth UID: `prof_attacker_123`
   - Target Document: `/users/prof_victim_456/students/stud_fake`
   - Data: `{"id": "stud_fake", "fullName": "Fake Student", "academicRegistration": "99999"}`
   - Operation: `CREATE`
   - Expected Result: `PERMISSION_DENIED`

3. **Payload 3 - Self-Authorization Escalation**:
   - Attacker Auth UID: `prof_attacker_123`
   - Target Document: `/users/prof_attacker_123`
   - Data: `{"role": "admin", "authorized": true}`
   - Operation: `UPDATE` (attempting to set role to admin without admin privileges)
   - Expected Result: `PERMISSION_DENIED`

4. **Payload 4 - Teacher Email Self-Modification**:
   - Attacker Auth UID: `prof_attacker_123`
   - Target Document: `/users/prof_attacker_123`
   - Data: `{"email": "hijacked@external.com"}`
   - Operation: `UPDATE`
   - Expected Result: `PERMISSION_DENIED`

5. **Payload 5 - Unauthenticated Grade Sniffing**:
   - Attacker Auth: `null` (Anonymous / Logged out)
   - Target Document: `/users/prof_victim_456/grades/grade_01`
   - Operation: `GET`
   - Expected Result: `PERMISSION_DENIED`

6. **Payload 6 - Cross-Teacher Attendance Record Manipulation**:
   - Attacker Auth UID: `prof_attacker_123`
   - Target Document: `/users/prof_victim_456/attendance/att_01`
   - Operation: `UPDATE` / `DELETE`
   - Expected Result: `PERMISSION_DENIED`

7. **Payload 7 - Admin Document Self-Insertion (Privilege Hijack)**:
   - Attacker Auth UID: `prof_attacker_123`
   - Target Document: `/admins/prof_attacker_123`
   - Data: `{"email": "prof_attacker@fake.com", "role": "admin"}`
   - Operation: `CREATE`
   - Expected Result: `PERMISSION_DENIED`

8. **Payload 8 - Root Collection Blind Listing**:
   - Attacker Auth UID: `prof_attacker_123`
   - Target Collection: `/admins`
   - Operation: `LIST`
   - Expected Result: `PERMISSION_DENIED`

9. **Payload 9 - Oversized String Buffer Attack (Denial of Wallet)**:
   - Attacker Auth UID: `prof_attacker_123`
   - Target Document: `/users/prof_attacker_123/students/stud_overflow`
   - Data: `{"id": "stud_overflow", "fullName": "A".repeat(5000), "academicRegistration": "123"}`
   - Operation: `CREATE`
   - Expected Result: `PERMISSION_DENIED`

10. **Payload 10 - Path Traversal / Malicious ID Injection**:
    - Attacker Auth UID: `prof_attacker_123`
    - Target Document: `/users/prof_attacker_123/students/../../admins/backdoor`
    - Operation: `WRITE`
    - Expected Result: `PERMISSION_DENIED`

11. **Payload 11 - Cross-Teacher Audit Log Eradication**:
    - Attacker Auth UID: `prof_attacker_123`
    - Target Document: `/users/prof_victim_456/auditLogs/log_01`
    - Operation: `DELETE`
    - Expected Result: `PERMISSION_DENIED`

12. **Payload 12 - Anonymous User Profile Listing**:
    - Attacker Auth: `null`
    - Target Collection: `/users`
    - Operation: `LIST`
    - Expected Result: `PERMISSION_DENIED`
