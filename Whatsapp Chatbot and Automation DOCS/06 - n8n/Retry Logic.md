# Retry Logic

---

# Purpose

Defines how workflow failures should be handled.

---

# Retry Strategy

Attempt 1

↓

Wait

↓

Attempt 2

↓

Wait

↓

Attempt 3

↓

Failure

↓

Log Error

↓

Notify Admin

---

# Retry Conditions

Temporary network issues.

Rate limiting.

Timeouts.

API unavailable.

---

# Non-Retry Conditions

Invalid phone number.

Authentication failure.

Invalid request.

Template rejected.

---

# Logging

Every retry attempt should record:

- Workflow Name
- Timestamp
- Error Message
- Retry Count
- Final Status

---

# Goal

Recover automatically whenever possible while preventing duplicate messages or infinite retry loops.