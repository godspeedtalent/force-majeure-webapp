# Business Logic Decisions - APPROVED

**Date:** January 26, 2026
**Status:** ✅ Decisions Finalized
**Next Step:** Implementation

---

## 💰 PAYMENT & ORDERS - Approved Policies

### ✅ Q1: $0 Orders Policy
**Decision:** **Allow $0 orders, skip payment processing**
- Allow $0 orders (free tickets + 100% promo combinations)
- **Bypass Stripe payment processing entirely** when total = $0
- Create order record and send email confirmation
- **Implementation Priority:** MEDIUM

**Technical Notes:**
- Check `if (total === 0)` before calling `processPayment()`
- Skip Stripe entirely, go straight to order creation
- Send confirmation email instead of payment receipt

---

### ✅ Q2: Minimum Order Amount
**Decision:** **No minimum** (accept any amount including $0.01)
- Accept orders of any amount
- Payment gateway will handle micro-transaction fees
- **Implementation Priority:** NONE (current behavior is correct)

---

### ✅ Q3: Maximum Order Amount (Fraud Prevention)
**Decision:** **Soft limit with warning**
- Soft limit at $5,000-$10,000 range
- Show warning message to user, allow them to proceed
- No hard block, no manual review required
- **Implementation Priority:** MEDIUM

**UI Message:**
> "Large order detected ($X,XXX). Please verify your order details before proceeding. For bulk purchases, contact support@forcemajeure.com"

---

### ✅ Q4: Maximum Ticket Quantity
**Decision:** **Per-event maximum set by organizer**
- Event organizers can set max tickets per order (default: 100)
- Different events can have different limits (10, 50, 100, 500, etc.)
- Database field: `events.max_tickets_per_order`
- **Implementation Priority:** HIGH

**Technical Implementation:**
- Add `max_tickets_per_order` column to `events` table (default 100)
- Validate quantity against this limit in checkout
- Display limit in UI: "Maximum X tickets per order"

---

### ✅ Q5: Ticket Protection Fee Structure
**Decision:** **Minimum of flat fee or percentage (site-level setting)**
- Configurable at site level (not per-event)
- Take whichever is higher: flat $4.99 OR percentage (e.g., 10%)
- Example: $2 ticket → $4.99 (flat higher), $100 order → $10 (percentage higher)
- **Implementation Priority:** LOW (enhancement)

**Configuration:**
```typescript
// Site-level settings
PROTECTION_FEE = {
  flatFee: 4.99,
  percentageFee: 0.10, // 10%
  method: 'max' // Take whichever is higher
}
```

---

### ✅ Q6: Protection Fee Cap
**Decision:** **Cap at 100% of ticket price**
- Protection fee cannot exceed ticket price
- $2 ticket → max $2 protection fee (not $4.99)
- Prevents fee from being more than the ticket itself
- **Implementation Priority:** LOW

**Example:**
- $2 ticket: protection fee capped at $2.00 (not $4.99)
- $50 ticket: protection fee remains $4.99 (under 100%)

---

### ✅ Q7: Manual Review for Large Orders
**Decision:** **Flag for review based on amount ($10,000+)**
- Orders ≥ $10,000 flagged for manual review
- Email notification sent to admin/support team
- Order created but marked as "pending_review"
- User receives confirmation: "Order under review, will process within 24 hours"
- **Implementation Priority:** MEDIUM

**Database:**
- Add `status` field to orders: `confirmed`, `pending_review`, `approved`, `rejected`
- Email notification to support team with order details

---

### ✅ Q8: ZIP Code Validation
**Decision:** **Block known invalid ZIP ranges**
- Block 00000-00600 and other known invalid ranges
- Frontend validation before submission
- Provide clear error: "Please enter a valid US ZIP code"
- **Implementation Priority:** LOW

**Invalid ZIP Ranges:**
- 00000-00600
- 96701-96898
- 96950-96999

---

## 🔐 AUTHENTICATION & SECURITY - Approved Policies

### ✅ Q9: Maximum Password Length
**Decision:** **128 characters maximum**
- Standard bcrypt limit (72 bytes effective, 128 char UI limit)
- Frontend validation: "Password must be 128 characters or less"
- **Implementation Priority:** MEDIUM (DOS prevention)

---

### ✅ Q10: Password Complexity Requirements
**Decision:** **Enforce strong complexity**
- Minimum 12 characters
- Require: uppercase, lowercase, number, special character
- Show password strength indicator during input
- **Implementation Priority:** HIGH (security)

**Validation Rules:**
```typescript
const passwordRules = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: true
}
```

**Error Messages:**
- "Password must be at least 12 characters"
- "Password must include uppercase, lowercase, number, and special character"

---

### ✅ Q11: Login Attempt Rate Limiting
**Decision:** **Progressive delays + CAPTCHA**
- Progressive delays: 1s, 2s, 4s, 8s, 16s after each failed attempt
- Show CAPTCHA after 5 failed attempts
- Reset counter after successful login
- **Implementation Priority:** MEDIUM

**Implementation:**
```typescript
const delays = [1000, 2000, 4000, 8000, 16000]; // milliseconds
if (failedAttempts >= 5) {
  showCaptcha = true;
}
```

---

### ✅ Q12: Password Change Session Invalidation
**Decision:** **Automatically log out all other devices**
- Password change logs out all sessions EXCEPT current device
- User stays logged in on device where password was changed
- Email notification sent: "Your password was changed"
- **Implementation Priority:** HIGH (security)

**User Experience:**
- Password updated successfully
- Other devices logged out automatically
- Email sent to account email address

---

### ✅ Q13: "Remember Me" Expiration
**Decision:** **30-day expiration**
- Remember me sessions expire after 30 days
- User must log in again after expiration
- Clear from localStorage after 30 days
- **Implementation Priority:** MEDIUM

**Implementation:**
```typescript
const REMEMBER_ME_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days in ms
```

---

### ✅ Q14: Inactivity Session Timeout
**Decision:** **No automatic timeout**
- Sessions persist until manual logout or token expiration
- Rely on Supabase default token expiration (typically 7 days)
- No inactivity-based logout
- **Implementation Priority:** NONE (current behavior is correct)

---

## 👤 PROFILE & CONTENT - Approved Policies

### ✅ Q15: Maximum Username Length
**Decision:** **50 characters maximum**
- **RESOLVED:** User refers to `display_name` field as "USERNAME"
- **ALREADY IMPLEMENTED:** Database has constraint `CONSTRAINT display_name_length CHECK (char_length(display_name) <= 50)`
- Validation error: "Display name must be 50 characters or less"
- **Implementation Priority:** ✅ COMPLETED (already in database schema)

**Schema Verification:**

- Database has `display_name` field with 50 character limit (already enforced)
- No separate `username` field exists in profiles table
- User's reference to "USERNAME" confirmed to be the `display_name` field

---

### ✅ Q16: HTML/Script Tags in Display Names
**Decision:** **Backend sanitizes/strips HTML before storage**
- Backend strips all HTML tags before database storage
- Frontend passes raw input to backend
- Database stores sanitized text only
- **Implementation Priority:** MEDIUM (security)

**Backend Sanitization:**
```typescript
// Strip all HTML tags
const sanitized = displayName.replace(/<[^>]*>/g, '');
```

---

### ✅ Q17: Null Byte Characters
**Decision:** **Strip null bytes silently**
- Remove `\0` characters before saving
- No error message, just silently clean the input
- User sees cleaned version: `test\0name` → `testname`
- **Implementation Priority:** LOW

---

### ✅ Q18: Different Name Field Length Limits
**Decision:** **Different limits per field**
- **ACTUAL DATABASE SCHEMA:**
  - `display_name`: 50 characters (already constrained)
  - `full_name`: 100 characters (already constrained)
- **Note:** Profiles table does NOT have separate `first_name`/`last_name` columns
- During signup, `first_name` + `last_name` from form are combined into `full_name` field
- **Implementation Priority:** ✅ COMPLETED (already in database schema)

**Schema Details:**

```sql
-- Existing constraints in profiles table:
CONSTRAINT display_name_length CHECK (char_length(display_name) <= 50)
CONSTRAINT full_name_length CHECK (char_length(full_name) <= 100)
```

---

### ✅ Q19: Profanity Filter
**Decision:** **Automated profanity filter**
- Reject display names containing common offensive words
- Show error: "Display name contains inappropriate content"
- Use standard profanity word list
- **Implementation Priority:** MEDIUM

**Implementation Options:**
- Use library: `bad-words` npm package
- Custom word list for multi-language support
- Allow user to choose different name

---

### ✅ Q20: International Characters & Emojis
**Decision:** **Allow all Unicode**
- Accept all international characters (Chinese, Arabic, etc.)
- Allow emojis in display names
- Ensure email templates and PDFs support Unicode rendering
- **Implementation Priority:** LOW (verify rendering)

**Testing Required:**
- Test email rendering with international characters
- Test PDF generation with emojis
- Verify font support for various character sets

---

## Implementation Priority Summary

### 🔴 HIGH PRIORITY (Implement within 1 week)
1. **Q4:** Per-event maximum ticket quantity (database + validation)
2. **Q10:** Password complexity enforcement (12 char, complexity rules)
3. **Q12:** Password change session invalidation (log out other devices)

### 🟡 MEDIUM PRIORITY (Implement within 2-4 weeks)
1. **Q1:** $0 order payment bypass (skip Stripe when total = $0)
2. **Q3:** Large order warning (soft limit at $5k-$10k)
3. **Q7:** Manual review flagging ($10k+ orders)
4. **Q9:** Maximum password length (128 characters)
5. **Q11:** Progressive login delays + CAPTCHA
6. **Q13:** Remember me 30-day expiration
7. **Q16:** Backend HTML sanitization for display names
8. **Q19:** Automated profanity filter

### 🟢 LOW PRIORITY (Nice to have, implement as time allows)
1. **Q5:** Protection fee structure (min of flat or percentage)
2. **Q6:** Protection fee cap (100% of ticket price)
3. **Q8:** ZIP code invalid range blocking
4. **Q17:** Strip null bytes from names
5. **Q20:** Verify Unicode rendering (email/PDF testing)

---

## Database Schema Changes Required

### Events Table
```sql
ALTER TABLE events
ADD COLUMN max_tickets_per_order INTEGER DEFAULT 100;
```

### Orders Table
```sql
ALTER TABLE orders
ADD COLUMN status VARCHAR(50) DEFAULT 'confirmed'
  CHECK (status IN ('confirmed', 'pending_review', 'approved', 'rejected'));
```

### Profiles Table
```sql
-- ✅ ALREADY IMPLEMENTED - No changes needed
-- Current schema already has these constraints:
-- CONSTRAINT display_name_length CHECK (char_length(display_name) <= 50)
-- CONSTRAINT full_name_length CHECK (char_length(full_name) <= 100)

-- Note: Profiles table structure:
-- - display_name (50 chars) - User's display name/"username"
-- - full_name (100 chars) - Combined first + last name from signup
-- - No separate first_name/last_name columns in profiles table
```

---

## Configuration Changes

### Create site_settings table (if doesn't exist)
```sql
CREATE TABLE IF NOT EXISTS site_settings (
  key VARCHAR(255) PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Protection fee settings
INSERT INTO site_settings (key, value, description) VALUES
('protection_fee', '{"flatFee": 4.99, "percentageFee": 0.10, "method": "max"}', 'Ticket protection fee structure');

-- Order limits
INSERT INTO site_settings (key, value, description) VALUES
('order_limits', '{"softMaxAmount": 10000, "manualReviewThreshold": 10000}', 'Order amount thresholds');
```

---

## Next Steps

1. **Create GitHub Issues** for each high-priority item
2. **Verify Database Schema** - Check username vs display_name fields
3. **Write Migrations** for database schema changes
4. **Update Documentation** - Add policies to CLAUDE.md
5. **Implementation Plan** - Assign tickets to developers
6. **Testing Plan** - Update adversarial tests with approved policies
7. **User Communication** - Update Terms of Service if needed

---

## Database Schema Verification - COMPLETED ✅

### Q15 & Q18 Resolution

**Verified:** January 26, 2026 - Database schema checked against business requirements

**Profiles Table Actual Schema:**

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  email TEXT,
  display_name TEXT,  -- 50 char limit (Q15 "USERNAME")
  full_name TEXT,     -- 100 char limit (Q18 combined name)
  -- ... other fields
  CONSTRAINT display_name_length CHECK (char_length(display_name) <= 50),
  CONSTRAINT full_name_length CHECK (char_length(full_name) <= 100)
);
```

**Key Findings:**

1. **Q15 "USERNAME"** = `display_name` field (50 chars) ✅ Already constrained
2. **Q18 Name fields** = `display_name` (50) + `full_name` (100) ✅ Already constrained
3. **No separate `first_name`/`last_name` columns** - These only exist in `auth.users.raw_user_meta_data` during signup
4. **Signup flow:** User enters first + last name → Combined into `full_name` field via trigger

**Conclusion:** Q15 and Q18 requirements are ALREADY IMPLEMENTED in the database schema. No migration needed.

---

**Document Prepared By:** Adversarial Testing Initiative
**Approval Date:** January 26, 2026
**Schema Verification:** January 26, 2026
**Ready for Implementation:** ✅ YES - All database constraints verified
