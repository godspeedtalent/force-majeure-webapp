# Manual Migration Verification Checklist

Use this checklist to verify the migration against your live Supabase database.

## How to Use This Guide

1. Open your Supabase Dashboard
2. Go to **Database** → **Tables**
3. Check each table below against what's in the dashboard

## Tables to Verify (32 total)

For each table, verify it exists and has the expected columns.

### ✅ Core Tables

- [ ] **cities**
  - Columns: id, name, state, created_at, updated_at
  - Unique constraint: (name, state)

- [ ] **roles**
  - Columns: id, name, display_name, description, permissions (jsonb), is_system_role, created_at, updated_at
  - Check: 5 default roles exist (user, admin, developer, org_admin, org_staff)

- [ ] **organizations**
  - Columns: id, name, profile_picture, owner_id, created_at, updated_at
  - Foreign key: owner_id → auth.users(id)

- [ ] **venues**
  - Columns: id, name, address, city, state, capacity, image_url, city_id, test_data, created_at, updated_at
  - Foreign key: city_id → cities(id)

- [ ] **events**
  - Columns: id, name, description, venue_id, start_time, end_time, is_after_hours, organization_id, test_data, created_at, updated_at
  - Foreign keys: venue_id → venues(id), organization_id → organizations(id)

### ✅ Genre & Artist Tables

- [ ] **genres**
  - Columns: id, name (unique), parent_id, created_at, updated_at
  - Self-referencing FK: parent_id → genres(id)

- [ ] **artists**
  - Columns: id, name, bio, image_url, website, genre (legacy), test_data, created_at, updated_at

- [ ] **artist_genres** (junction table)
  - Columns: id, artist_id, genre_id, is_primary, created_at
  - Foreign keys: artist_id → artists(id), genre_id → genres(id)
  - Unique: (artist_id, genre_id)

- [ ] **event_artists** (junction table)
  - Columns: id, event_id, artist_id, created_at
  - Foreign keys: event_id → events(id), artist_id → artists(id)

### ✅ User & Auth Tables

- [ ] **profiles**
  - Columns: id, user_id, email, display_name, full_name, gender, age_range, home_city, avatar_url, phone_number, instagram_handle, billing_address, billing_city, billing_state, billing_zip, stripe_customer_id, organization_id, created_at, updated_at
  - Primary key: id (references auth.users)
  - Foreign key: organization_id → organizations(id)

- [ ] **user_roles** (junction table)
  - Columns: id, user_id, role (enum - legacy), role_id, created_at
  - Foreign keys: user_id → auth.users(id), role_id → roles(id)
  - Unique: (user_id, role_id)

### ✅ Feature Management

- [ ] **feature_flags**
  - Columns: id, flag_name, is_enabled, environment, description, disabled, created_at, updated_at
  - Unique: (flag_name, environment)
  - Check: At least 2 default flags exist

### ✅ Ticketing Tables

- [ ] **ticket_tiers**
  - Columns: id, event_id, name, description, price_cents (integer), total_tickets, available_inventory, reserved_inventory, sold_inventory, tier_order, is_active, hide_until_previous_sold_out, fee_flat_cents, fee_pct_bps, created_at, updated_at
  - Foreign key: event_id → events(id)
  - Check constraints: All inventory fields >= 0

- [ ] **ticket_holds**
  - Columns: id, ticket_tier_id, quantity, user_id, fingerprint, expires_at, created_at
  - Foreign keys: ticket_tier_id → ticket_tiers(id), user_id → auth.users(id)

- [ ] **orders**
  - Columns: id, user_id, event_id, subtotal_cents, fees_cents, total_cents, currency, stripe_payment_intent_id, stripe_checkout_session_id, status, created_at, updated_at
  - Foreign keys: user_id → auth.users(id), event_id → events(id)
  - Unique: stripe_payment_intent_id, stripe_checkout_session_id

- [ ] **order_items**
  - Columns: id, order_id, ticket_tier_id, quantity, unit_price_cents, unit_fee_cents, subtotal_cents (generated), fees_cents (generated), total_cents (generated), created_at
  - Foreign keys: order_id → orders(id), ticket_tier_id → ticket_tiers(id)

- [ ] **tickets**
  - Columns: id, order_id, order_item_id, ticket_tier_id, event_id, attendee_name, attendee_email, qr_code_data (unique), status, checked_in_at, checked_in_by, apple_wallet_url, google_wallet_url, created_at, updated_at
  - Foreign keys: order_id → orders(id), order_item_id → order_items(id), ticket_tier_id → ticket_tiers(id), event_id → events(id)

- [ ] **ticketing_fees**
  - Columns: id, fee_name, fee_type, fee_value, is_active, environment, created_at, updated_at
  - Unique: (fee_name, environment)
  - Check: 3 default fees exist

- [ ] **promo_codes**
  - Columns: id, code (unique), discount_type, discount_value, is_active, created_at, updated_at, expires_at
  - Check: 2 test promo codes exist

### ✅ Queue Management

- [ ] **ticketing_sessions**
  - Columns: id, event_id, user_session_id, status, entered_at, created_at, updated_at
  - Foreign key: event_id → events(id)
  - Unique: (event_id, user_session_id, status)

- [ ] **queue_configurations**
  - Columns: id, event_id (unique), max_concurrent_users, checkout_timeout_minutes, session_timeout_minutes, enable_queue, created_at, updated_at
  - Foreign key: event_id → events(id)

### ✅ Content & Analytics

- [ ] **exclusive_content_grants**
  - Columns: id, user_id, event_id, order_id, content_type, content_url, expires_at, accessed_at, access_count, created_at
  - Foreign keys: user_id → auth.users(id), event_id → events(id), order_id → orders(id)
  - Unique: (user_id, event_id, content_type)

- [ ] **event_views**
  - Columns: id, event_id, viewer_id, viewed_at, session_id, ip_address, user_agent, created_at
  - Foreign keys: event_id → events(id), viewer_id → auth.users(id)

- [ ] **event_images**
  - Columns: id, event_id, storage_path (unique), file_name, file_size, mime_type, width, height, is_primary, uploaded_by, created_at, updated_at
  - Foreign keys: event_id → events(id), uploaded_by → auth.users(id)

### ✅ Integrations

- [ ] **webhook_events**
  - Columns: id, event_id (unique), event_type, processed_at, payload (jsonb)

### ✅ Developer Tools

- [ ] **dev_notes**
  - Columns: id, created_at, updated_at, author_id, author_name, message, type, status
  - Foreign key: author_id → auth.users(id)

- [ ] **datagrid_configs**
  - Columns: id, user_id, grid_id, config (jsonb), created_at, updated_at
  - Foreign key: user_id → auth.users(id)
  - Unique: (user_id, grid_id)

### ✅ Scavenger Hunt (Optional Feature)

- [ ] **scavenger_locations**
  - Columns: id, name, checkin_count, created_at, updated_at

- [ ] **scavenger_claims**
  - Columns: id, user_id, location_id, created_at
  - Foreign keys: user_id → auth.users(id), location_id → scavenger_locations(id)
  - Unique: (user_id, location_id)

- [ ] **scavenger_tokens**
  - Columns: id, token (unique), location_id, is_active, created_at
  - Foreign key: location_id → scavenger_locations(id)

### ✅ Additional Tables

- [ ] **merch** (if exists - schema may vary)
  - Check: Table exists and has basic structure

- [ ] **api_logs** (if exists - schema may vary)
  - Check: Table exists and has basic structure

---

## Functions to Verify

Go to **Database** → **Functions** and check these exist:

- [ ] `update_updated_at_column()` - Auto-update timestamps
- [ ] `has_role(user_id, role_name)` - Role checking
- [ ] `has_permission(user_id, permission_name)` - Permission checking
- [ ] `get_user_roles(user_id)` - Get all roles for user
- [ ] `is_dev_admin()` - Dev admin check via feature flags
- [ ] `create_ticket_hold()` - Reserve tickets
- [ ] `release_ticket_hold()` - Release reserved tickets
- [ ] `convert_hold_to_sale()` - Convert reservation to sale
- [ ] `get_event_view_count()` - Event analytics
- [ ] `record_event_view()` - Track page view
- [ ] `handle_new_user()` - Auto-create profile on signup
- [ ] `get_all_users_with_email()` - Admin user list
- [ ] `get_all_users()` - Complete user info
- [ ] `get_genre_hierarchy()` - Recursive genre tree
- [ ] `get_genre_path()` - Genre breadcrumb
- [ ] `get_artist_genres()` - Artist's genres
- [ ] `get_artists_by_genre()` - Find artists by genre
- [ ] `cleanup_old_ticketing_sessions()` - Queue cleanup
- [ ] `validate_ticket_tier_inventory()` - Inventory validation
- [ ] `validate_order_totals()` - Order pricing validation

---

## Triggers to Verify

Go to **Database** → **Triggers** (or check in table settings):

- [ ] `update_*_updated_at` triggers on all tables with updated_at
- [ ] `check_ticket_tier_inventory` on ticket_tiers
- [ ] `check_order_totals` on orders
- [ ] `on_auth_user_created` on auth.users

---

## RLS Policies to Check

Go to **Authentication** → **Policies** (or table settings):

- [ ] All tables have RLS enabled
- [ ] Profiles: Users can view/update own profile, admins can view all
- [ ] Orders: Users can view own orders, admins can view all
- [ ] Tickets: Users can view own tickets, admins can view all
- [ ] Public tables (events, venues, artists, genres) are publicly viewable
- [ ] Admin tables (feature_flags, ticketing_fees) require admin role

---

## Storage Buckets

Go to **Storage**:

- [ ] `event-images` bucket exists
- [ ] Bucket is public
- [ ] File size limit: 5MB
- [ ] Allowed types: jpeg, jpg, png, webp, gif
- [ ] Storage policies allow public read, admin/developer write

---

## Summary

Total items to verify:
- ✅ Tables: 32
- ✅ Functions: 20+
- ✅ Triggers: 15+
- ✅ Storage: 1 bucket

**Notes:**
- If you find tables/columns NOT in this list, let me know
- If tables are missing columns from this list, let me know
- The migration should match your current production schema

---

## What to Do After Verification

If everything matches ✅:
- The migration is ready to use
- Archive old migrations to `migrations/archive/`
- Use `00000000000000_complete_database_init.sql` as your base

If you find differences ⚠️:
- Note which tables/columns are different
- Share the differences
- I'll update the migration accordingly
