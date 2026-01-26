# RLS Policy Optimization Analysis

## Summary

This document catalogs all 121+ RLS policies that need optimization by wrapping `auth.uid()`, `has_role(auth.uid())`, and `is_dev_admin(auth.uid())` calls with `(SELECT ...)` to prevent sequential scans and improve query performance.

### Why This Matters

PostgreSQL's query planner treats unwrapped `auth.uid()` as volatile, preventing index usage and forcing sequential scans. Wrapping these calls in `(SELECT ...)` marks them as stable within a single query execution, enabling index-based lookups.

**Performance Impact:**
- Sequential scan: O(n) - scans entire table
- Index scan: O(log n) - uses B-tree indexes
- For tables with millions of rows, this can mean 1000x+ performance improvement

---

## HIGH PRIORITY TABLES

### TABLE: profiles (5 policies)

#### Policy 1: "Users can view own profile"
**Type:** SELECT
**Current:** `USING (auth.uid() = id)`
**Fixed:** `USING ((SELECT auth.uid()) = id)`

```sql
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING ((SELECT auth.uid()) = id);
```

#### Policy 2: "Users can update own profile"
**Type:** UPDATE
**Current:** `USING (auth.uid() = id)`
**Fixed:** `USING ((SELECT auth.uid()) = id)`

```sql
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING ((SELECT auth.uid()) = id);
```

#### Policy 3: "Admins can view all profiles"
**Type:** SELECT
**Current:**
```sql
USING (
  auth.uid() IS NOT NULL AND
  (has_role(auth.uid(), 'admin') OR is_dev_admin(auth.uid()))
)
```
**Fixed:**
```sql
USING (
  (SELECT auth.uid()) IS NOT NULL AND
  (has_role((SELECT auth.uid()), 'admin') OR is_dev_admin((SELECT auth.uid())))
)
```

```sql
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    (has_role((SELECT auth.uid()), 'admin') OR is_dev_admin((SELECT auth.uid())))
  );
```

#### Policy 4: "Admins can update profiles"
**Type:** UPDATE
**Current:** Same as Policy 3
**Fixed:** Same wrapper pattern

```sql
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;
CREATE POLICY "Admins can update profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    (has_role((SELECT auth.uid()), 'admin') OR is_dev_admin((SELECT auth.uid())))
  );
```

#### Policy 5: "Admins can delete profiles"
**Type:** DELETE
**Current:** Same as Policy 3
**Fixed:** Same wrapper pattern

```sql
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
CREATE POLICY "Admins can delete profiles"
  ON profiles FOR DELETE
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    (has_role((SELECT auth.uid()), 'admin') OR is_dev_admin((SELECT auth.uid())))
  );
```

---

### TABLE: orders (5 policies)

#### Policy 1: "Users can view their own orders"
**Type:** SELECT
**Current:** `USING (user_id = auth.uid())`
**Fixed:** `USING (user_id = (SELECT auth.uid()))`

```sql
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
CREATE POLICY "Users can view their own orders"
  ON orders FOR SELECT
  USING (user_id = (SELECT auth.uid()));
```

#### Policy 2: "Users can insert their own orders"
**Type:** INSERT
**Current:** `WITH CHECK (user_id = auth.uid())`
**Fixed:** `WITH CHECK (user_id = (SELECT auth.uid()))`

```sql
DROP POLICY IF EXISTS "Users can insert their own orders" ON orders;
CREATE POLICY "Users can insert their own orders"
  ON orders FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));
```

#### Policy 3: "Admins can view all orders"
**Type:** SELECT
**Current:**
```sql
USING (
  auth.uid() IS NOT NULL AND
  (has_role(auth.uid(), 'admin') OR is_dev_admin(auth.uid()))
)
```
**Fixed:**
```sql
USING (
  (SELECT auth.uid()) IS NOT NULL AND
  (has_role((SELECT auth.uid()), 'admin') OR is_dev_admin((SELECT auth.uid())))
)
```

```sql
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
CREATE POLICY "Admins can view all orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    (has_role((SELECT auth.uid()), 'admin') OR is_dev_admin((SELECT auth.uid())))
  );
```

#### Policy 4: "Admins can update orders"
**Type:** UPDATE
**Fixed:** Same as Policy 3

```sql
DROP POLICY IF EXISTS "Admins can update orders" ON orders;
CREATE POLICY "Admins can update orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    (has_role((SELECT auth.uid()), 'admin') OR is_dev_admin((SELECT auth.uid())))
  );
```

#### Policy 5: "Admins can delete orders"
**Type:** DELETE
**Fixed:** Same as Policy 3

```sql
DROP POLICY IF EXISTS "Admins can delete orders" ON orders;
CREATE POLICY "Admins can delete orders"
  ON orders FOR DELETE
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    (has_role((SELECT auth.uid()), 'admin') OR is_dev_admin((SELECT auth.uid())))
  );
```

---

### TABLE: organizations (4 policies)

#### Policy 1: "Users can view organizations they own or belong to"
**Type:** SELECT
**Current:**
```sql
USING (
  auth.uid() = owner_id
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.organization_id = organizations.id
  )
)
```
**Fixed:**
```sql
USING (
  (SELECT auth.uid()) = owner_id
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = (SELECT auth.uid())
    AND profiles.organization_id = organizations.id
  )
)
```

```sql
DROP POLICY IF EXISTS "Users can view organizations they own or belong to" ON organizations;
CREATE POLICY "Users can view organizations they own or belong to"
  ON organizations FOR SELECT
  USING (
    (SELECT auth.uid()) = owner_id
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = (SELECT auth.uid())
      AND profiles.organization_id = organizations.id
    )
  );
```

#### Policy 2: "Authenticated users can create organizations"
**Type:** INSERT
**Current:** `WITH CHECK (auth.uid() = owner_id)`
**Fixed:** `WITH CHECK ((SELECT auth.uid()) = owner_id)`

```sql
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON organizations;
CREATE POLICY "Authenticated users can create organizations"
  ON organizations FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = owner_id);
```

#### Policy 3: "Organization owners can update their organizations"
**Type:** UPDATE
**Current:** `USING (auth.uid() = owner_id)` and `WITH CHECK (auth.uid() = owner_id)`
**Fixed:** Wrap both

```sql
DROP POLICY IF EXISTS "Organization owners can update their organizations" ON organizations;
CREATE POLICY "Organization owners can update their organizations"
  ON organizations FOR UPDATE
  USING ((SELECT auth.uid()) = owner_id)
  WITH CHECK ((SELECT auth.uid()) = owner_id);
```

#### Policy 4: "Organization owners can delete their organizations"
**Type:** DELETE
**Current:** `USING (auth.uid() = owner_id)`
**Fixed:** `USING ((SELECT auth.uid()) = owner_id)`

```sql
DROP POLICY IF EXISTS "Organization owners can delete their organizations" ON organizations;
CREATE POLICY "Organization owners can delete their organizations"
  ON organizations FOR DELETE
  USING ((SELECT auth.uid()) = owner_id);
```

---

### TABLE: exclusive_content_grants (4 policies)

#### Policy 1: "Users can view their own content grants"
**Type:** SELECT
**Current:** `USING (user_id = auth.uid())`
**Fixed:** `USING (user_id = (SELECT auth.uid()))`

```sql
DROP POLICY IF EXISTS "Users can view their own content grants" ON exclusive_content_grants;
CREATE POLICY "Users can view their own content grants"
  ON exclusive_content_grants FOR SELECT
  USING (user_id = (SELECT auth.uid()));
```

#### Policy 2-4: Admin policies
**Pattern:** Same as other admin policies - wrap all `auth.uid()` with `(SELECT auth.uid())`

```sql
DROP POLICY IF EXISTS "Admins can insert content grants" ON exclusive_content_grants;
CREATE POLICY "Admins can insert content grants"
  ON exclusive_content_grants FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL AND
    (has_role((SELECT auth.uid()), 'admin') OR is_dev_admin((SELECT auth.uid())))
  );

DROP POLICY IF EXISTS "Admins can update content grants" ON exclusive_content_grants;
CREATE POLICY "Admins can update content grants"
  ON exclusive_content_grants FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    (has_role((SELECT auth.uid()), 'admin') OR is_dev_admin((SELECT auth.uid())))
  );

DROP POLICY IF EXISTS "Admins can delete content grants" ON exclusive_content_grants;
CREATE POLICY "Admins can delete content grants"
  ON exclusive_content_grants FOR DELETE
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    (has_role((SELECT auth.uid()), 'admin') OR is_dev_admin((SELECT auth.uid())))
  );
```

---

### TABLE: datagrid_configs (4 policies)

#### Policy 1: "Users can view own datagrid configs"
**Type:** SELECT
**Current:** `USING (auth.uid() = user_id)`
**Fixed:** `USING ((SELECT auth.uid()) = user_id)`

```sql
DROP POLICY IF EXISTS "Users can view own datagrid configs" ON datagrid_configs;
CREATE POLICY "Users can view own datagrid configs"
  ON datagrid_configs FOR SELECT
  USING ((SELECT auth.uid()) = user_id);
```

#### Policy 2: "Users can insert own datagrid configs"
**Type:** INSERT
**Current:** `WITH CHECK (auth.uid() = user_id)`
**Fixed:** `WITH CHECK ((SELECT auth.uid()) = user_id)`

```sql
DROP POLICY IF EXISTS "Users can insert own datagrid configs" ON datagrid_configs;
CREATE POLICY "Users can insert own datagrid configs"
  ON datagrid_configs FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);
```

#### Policy 3: "Users can update own datagrid configs"
**Type:** UPDATE
**Current:** Both USING and WITH CHECK need wrapping
**Fixed:**

```sql
DROP POLICY IF EXISTS "Users can update own datagrid configs" ON datagrid_configs;
CREATE POLICY "Users can update own datagrid configs"
  ON datagrid_configs FOR UPDATE
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
```

#### Policy 4: "Users can delete own datagrid configs"
**Type:** DELETE
**Current:** `USING (auth.uid() = user_id)`
**Fixed:** `USING ((SELECT auth.uid()) = user_id)`

```sql
DROP POLICY IF EXISTS "Users can delete own datagrid configs" ON datagrid_configs;
CREATE POLICY "Users can delete own datagrid configs"
  ON datagrid_configs FOR DELETE
  USING ((SELECT auth.uid()) = user_id);
```

---

## MEDIUM PRIORITY TABLES

### TABLE: events (3 policies)

All admin policies with pattern:
```sql
auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'admin') OR is_dev_admin(auth.uid()))
```

Fixed pattern:
```sql
(SELECT auth.uid()) IS NOT NULL AND (has_role((SELECT auth.uid()), 'admin') OR is_dev_admin((SELECT auth.uid())))
```

```sql
DROP POLICY IF EXISTS "Admins can insert events" ON events;
CREATE POLICY "Admins can insert events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL AND
    (has_role((SELECT auth.uid()), 'admin') OR is_dev_admin((SELECT auth.uid())))
  );

DROP POLICY IF EXISTS "Admins can update events" ON events;
CREATE POLICY "Admins can update events"
  ON events FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    (has_role((SELECT auth.uid()), 'admin') OR is_dev_admin((SELECT auth.uid())))
  )
  WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL AND
    (has_role((SELECT auth.uid()), 'admin') OR is_dev_admin((SELECT auth.uid())))
  );

DROP POLICY IF EXISTS "Admins can delete events" ON events;
CREATE POLICY "Admins can delete events"
  ON events FOR DELETE
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    (has_role((SELECT auth.uid()), 'admin') OR is_dev_admin((SELECT auth.uid())))
  );
```

---

### TABLE: cities (3 policies)

Same admin pattern as events:

```sql
DROP POLICY IF EXISTS "Admins can insert cities" ON cities;
CREATE POLICY "Admins can insert cities"
  ON cities FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL AND
    (has_role((SELECT auth.uid()), 'admin') OR is_dev_admin((SELECT auth.uid())))
  );

DROP POLICY IF EXISTS "Admins can update cities" ON cities;
CREATE POLICY "Admins can update cities"
  ON cities FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    (has_role((SELECT auth.uid()), 'admin') OR is_dev_admin((SELECT auth.uid())))
  )
  WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL AND
    (has_role((SELECT auth.uid()), 'admin') OR is_dev_admin((SELECT auth.uid())))
  );

DROP POLICY IF EXISTS "Admins can delete cities" ON cities;
CREATE POLICY "Admins can delete cities"
  ON cities FOR DELETE
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    (has_role((SELECT auth.uid()), 'admin') OR is_dev_admin((SELECT auth.uid())))
  );
```

---

### TABLE: environments (1 policy)

#### Policy: "admin_manage_environments"
**Type:** ALL
**Current:**
```sql
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
    AND r.name IN ('admin', 'developer')
  )
)
WITH CHECK (same as USING)
```

**Fixed:**
```sql
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = (SELECT auth.uid())
    AND r.name IN ('admin', 'developer')
  )
)
WITH CHECK (same as USING)
```

```sql
DROP POLICY IF EXISTS "admin_manage_environments" ON environments;
CREATE POLICY "admin_manage_environments"
  ON environments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = (SELECT auth.uid())
      AND r.name IN ('admin', 'developer')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = (SELECT auth.uid())
      AND r.name IN ('admin', 'developer')
    )
  );
```

---

### TABLE: event_rsvps (2 policies)

From file `20251128212457_91691c6c-15a0-421f-b2be-18c564ebfdcf.sql`:

```sql
DROP POLICY IF EXISTS "Users can insert their own RSVPs" ON event_rsvps;
CREATE POLICY "Users can insert their own RSVPs"
  ON event_rsvps
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own RSVPs" ON event_rsvps;
CREATE POLICY "Users can delete their own RSVPs"
  ON event_rsvps
  FOR DELETE USING ((SELECT auth.uid()) = user_id);
```

---

### TABLE: user_event_interests (Similar pattern to event_rsvps)

---

## ALL OTHER TABLES

### TABLE: venues (3 policies)

Same admin pattern as events and cities.

### TABLE: artists (3 policies)

Same admin pattern.

### TABLE: genres (1 policy)

```sql
DROP POLICY IF EXISTS "Admins and developers can manage genres" ON genres;
CREATE POLICY "Admins and developers can manage genres"
  ON genres FOR ALL
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    (has_role((SELECT auth.uid()), 'admin') OR has_role((SELECT auth.uid()), 'developer'))
  );
```

### TABLE: artist_genres (1 policy)

Same pattern as genres.

### TABLE: event_artists (1 policy)

Same admin pattern.

### TABLE: roles (1 policy)

```sql
DROP POLICY IF EXISTS "Admins and developers can manage roles" ON roles;
CREATE POLICY "Admins and developers can manage roles"
  ON roles FOR ALL
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    (
      has_role((SELECT auth.uid()), 'admin')
      OR has_role((SELECT auth.uid()), 'developer')
      OR is_dev_admin((SELECT auth.uid()))
    )
  );
```

### TABLE: feature_flags (3 policies)

Same admin pattern for INSERT, UPDATE, DELETE.

### TABLE: ticket_tiers (4 policies)

Same admin pattern for SELECT (admin only), INSERT, UPDATE, DELETE.

### TABLE: ticket_holds (4 policies)

#### Users can view/create:
```sql
DROP POLICY IF EXISTS "Users can view their own holds" ON ticket_holds;
CREATE POLICY "Users can view their own holds"
  ON ticket_holds FOR SELECT
  USING (user_id = (SELECT auth.uid()) OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can create holds" ON ticket_holds;
CREATE POLICY "Users can create holds"
  ON ticket_holds FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()) OR user_id IS NULL);
```

#### Admins can update/delete:
Same admin pattern.

### TABLE: order_items (5 policies)

#### User policies:
```sql
DROP POLICY IF EXISTS "Users can view items for their orders" ON order_items;
CREATE POLICY "Users can view items for their orders"
  ON order_items FOR SELECT
  USING (order_id IN (SELECT id FROM orders WHERE user_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "Users can insert items for their orders" ON order_items;
CREATE POLICY "Users can insert items for their orders"
  ON order_items FOR INSERT
  WITH CHECK (order_id IN (SELECT id FROM orders WHERE user_id = (SELECT auth.uid())));
```

#### Admin policies:
Same admin pattern for SELECT, UPDATE, DELETE.

### TABLE: tickets (5 policies)

#### User policies:
```sql
DROP POLICY IF EXISTS "Users can view tickets for their orders" ON tickets;
CREATE POLICY "Users can view tickets for their orders"
  ON tickets FOR SELECT
  USING (order_id IN (SELECT id FROM orders WHERE user_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "Users can update attendee info for their tickets" ON tickets;
CREATE POLICY "Users can update attendee info for their tickets"
  ON tickets FOR UPDATE
  USING (order_id IN (SELECT id FROM orders WHERE user_id = (SELECT auth.uid())))
  WITH CHECK (order_id IN (SELECT id FROM orders WHERE user_id = (SELECT auth.uid())));
```

#### Admin policies:
Same admin pattern for SELECT, INSERT, DELETE.

### TABLE: ticketing_fees (3 policies)

Same admin pattern for INSERT, UPDATE, DELETE.

### TABLE: promo_codes (3 policies)

Same admin pattern for INSERT, UPDATE, DELETE.

### TABLE: queue_configurations (3 policies)

```sql
DROP POLICY IF EXISTS "Admins can create queue configurations" ON queue_configurations;
CREATE POLICY "Admins can create queue configurations"
  ON queue_configurations FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL AND
    has_role((SELECT auth.uid()), 'admin')
  );

DROP POLICY IF EXISTS "Admins can update queue configurations" ON queue_configurations;
CREATE POLICY "Admins can update queue configurations"
  ON queue_configurations FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    has_role((SELECT auth.uid()), 'admin')
  )
  WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL AND
    has_role((SELECT auth.uid()), 'admin')
  );

DROP POLICY IF EXISTS "Admins can delete queue configurations" ON queue_configurations;
CREATE POLICY "Admins can delete queue configurations"
  ON queue_configurations FOR DELETE
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    has_role((SELECT auth.uid()), 'admin')
  );
```

### TABLE: event_views (1 policy)

```sql
DROP POLICY IF EXISTS "Only admins can delete event views" ON event_views;
CREATE POLICY "Only admins can delete event views"
  ON event_views FOR DELETE
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    has_role((SELECT auth.uid()), 'admin')
  );
```

### TABLE: event_images (3 policies)

```sql
DROP POLICY IF EXISTS "Admins and developers can insert event images" ON event_images;
CREATE POLICY "Admins and developers can insert event images"
  ON event_images FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL AND
    (
      has_role((SELECT auth.uid()), 'admin')
      OR has_role((SELECT auth.uid()), 'developer')
    )
  );

DROP POLICY IF EXISTS "Admins and developers can update event images" ON event_images;
CREATE POLICY "Admins and developers can update event images"
  ON event_images FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    (
      has_role((SELECT auth.uid()), 'admin')
      OR has_role((SELECT auth.uid()), 'developer')
    )
  );

DROP POLICY IF EXISTS "Admins and developers can delete event images" ON event_images;
CREATE POLICY "Admins and developers can delete event images"
  ON event_images FOR DELETE
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    (
      has_role((SELECT auth.uid()), 'admin')
      OR has_role((SELECT auth.uid()), 'developer')
    )
  );
```

### TABLE: dev_notes (4 policies)

```sql
DROP POLICY IF EXISTS "Developers can view all dev notes" ON dev_notes;
CREATE POLICY "Developers can view all dev notes"
  ON dev_notes FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    (
      has_role((SELECT auth.uid()), 'developer')
      OR has_role((SELECT auth.uid()), 'admin')
    )
  );

DROP POLICY IF EXISTS "Developers can create dev notes" ON dev_notes;
CREATE POLICY "Developers can create dev notes"
  ON dev_notes FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL AND
    (has_role((SELECT auth.uid()), 'developer') OR has_role((SELECT auth.uid()), 'admin'))
    AND author_id = (SELECT auth.uid())
  );

DROP POLICY IF EXISTS "Developers can update their own dev notes" ON dev_notes;
CREATE POLICY "Developers can update their own dev notes"
  ON dev_notes FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    author_id = (SELECT auth.uid())
    AND (has_role((SELECT auth.uid()), 'developer') OR has_role((SELECT auth.uid()), 'admin'))
  )
  WITH CHECK (author_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Developers can delete their own dev notes" ON dev_notes;
CREATE POLICY "Developers can delete their own dev notes"
  ON dev_notes FOR DELETE
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    author_id = (SELECT auth.uid())
    AND (has_role((SELECT auth.uid()), 'developer') OR has_role((SELECT auth.uid()), 'admin'))
  );
```

### TABLE: table_metadata (1 policy)

```sql
DROP POLICY IF EXISTS "Only admins can modify table metadata" ON table_metadata;
CREATE POLICY "Only admins can modify table metadata"
  ON table_metadata FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = (SELECT auth.uid())
      AND r.name = 'admin'
    )
  );
```

### TABLE: column_customizations (1 policy)

Same pattern as table_metadata.

### TABLE: scavenger_locations (1 policy)

Same admin pattern.

### TABLE: scavenger_claims (1 policy)

Same admin pattern.

### TABLE: scavenger_tokens (1 policy)

Same admin pattern.

### TABLE: artist_registrations (4 policies)

```sql
DROP POLICY IF EXISTS "Users can view their own artist registrations" ON artist_registrations;
CREATE POLICY "Users can view their own artist registrations"
  ON artist_registrations FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create artist registrations" ON artist_registrations;
CREATE POLICY "Users can create artist registrations"
  ON artist_registrations FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Admins can view all artist registrations" ON artist_registrations;
CREATE POLICY "Admins can view all artist registrations"
  ON artist_registrations FOR SELECT
  TO authenticated
  USING (has_role((SELECT auth.uid()), 'admin'));

DROP POLICY IF EXISTS "Admins can update artist registrations" ON artist_registrations;
CREATE POLICY "Admins can update artist registrations"
  ON artist_registrations FOR UPDATE
  TO authenticated
  USING (has_role((SELECT auth.uid()), 'admin'));
```

### STORAGE POLICIES

Multiple storage policies for `storage.objects` table related to:
- event-images bucket
- artist-images bucket
- profile-images bucket

All follow pattern with `auth.uid()` in WHERE clauses that need wrapping.

### Additional tables with similar patterns:

- **undercard_requests**
- **user_requests**
- **rave_family_members**
- **rave_family_circles**
- **artist_recordings**
- **activity_logs**
- **user_artists**
- **ticket_groups**
- **report_configurations**
- **report_recipients**
- **report_history**
- **notification_settings**
- **media_galleries**
- **media_items**
- **recording_ratings**
- **chart_labels**
- **chart_label_releases**
- **event_partners**

---

## MIGRATION STRATEGY

### Option 1: Single Comprehensive Migration

Create one migration file that optimizes all 121+ policies in one transaction.

**Pros:**
- Atomic operation - all or nothing
- Single deployment
- Easier rollback

**Cons:**
- Large migration file
- Longer execution time
- Higher risk if any policy has syntax errors

### Option 2: Phased Migrations

Create separate migrations for:
1. HIGH PRIORITY tables (profiles, orders, organizations, exclusive_content_grants, datagrid_configs)
2. MEDIUM PRIORITY tables (events, cities, environments, event_rsvps, user_event_interests)
3. ALL OTHER tables (batch 1)
4. ALL OTHER tables (batch 2)
5. STORAGE policies

**Pros:**
- Smaller, focused migrations
- Easier testing and validation
- Lower risk per deployment
- Can prioritize based on query performance impact

**Cons:**
- Multiple deployments
- More files to manage

### Recommended Approach

Use Option 2 (Phased Migrations) with this sequence:

1. **Phase 1 - Critical User Tables** (profiles, orders, datagrid_configs)
   - Highest query volume
   - Direct user impact
   - Deploy during low-traffic window

2. **Phase 2 - Core Business Tables** (events, organizations, exclusive_content_grants)
   - High admin usage
   - Moderate query volume

3. **Phase 3 - Supporting Tables** (venues, artists, tickets, order_items, etc.)
   - Lower priority
   - Can batch multiple tables

4. **Phase 4 - Metadata & Storage** (table_metadata, column_customizations, storage policies)
   - Lowest priority
   - Specialized use cases

---

## TESTING CHECKLIST

Before deploying each migration:

- [ ] Validate SQL syntax with `psql --dry-run`
- [ ] Test on development database
- [ ] Verify no permission regressions
- [ ] Run EXPLAIN ANALYZE on key queries
- [ ] Check for query plan improvements (index scans vs seq scans)
- [ ] Confirm application functionality unchanged
- [ ] Monitor error logs during deployment
- [ ] Have rollback script ready

---

## PERFORMANCE MONITORING

After deployment, monitor:

1. **Query execution times** - Should see 10-100x improvement on user-specific queries
2. **Index usage** - Check `pg_stat_user_indexes` for increased index scans
3. **Sequential scan reduction** - Check `pg_stat_user_tables` for decreased seq_scan counts
4. **Connection pool metrics** - Shorter query times may reduce connection contention
5. **User-reported performance** - Page load times, data grid responsiveness

---

## TOTAL COUNT SUMMARY

- **HIGH PRIORITY**: ~22 policies across 5 tables
- **MEDIUM PRIORITY**: ~10 policies across 5 tables
- **ALL OTHER**: ~89+ policies across 40+ tables
- **TOTAL**: 121+ policies requiring optimization

Each policy needs:
- `auth.uid()` → `(SELECT auth.uid())`
- `has_role(auth.uid(), ...)` → `has_role((SELECT auth.uid()), ...)`
- `is_dev_admin(auth.uid())` → `is_dev_admin((SELECT auth.uid()))`
