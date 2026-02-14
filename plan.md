# PharmaShield — Full Implementation Plan (v2)

**Tagline:** *A Predictive Blockchain Network for Counterfeit Drug Prevention*

---

## Phase 1: Database Schema Expansion
- Add `batch_status` enum: `active`, `sold`, `recalled`, `expired`
- Add columns to `batches`: `status`, `image_url`, `storage_conditions`, `recalled_at`, `recalled_by`
- Create `consumer_reports` table (consumer feedback/complaints with photo URL)
- Create `trust_scores` table (manufacturer trust scores, computed periodically)
- Add `distributor`, `auditor`, `consumer` to `app_role` enum
- Create storage bucket for medicine images

## Phase 2: Consumer Verification Flow (HIGH PRIORITY)
- Create `/consumer` public-facing verification page
- QR scanner with camera (simple, clean)
- Blockchain + Supabase verification
- Beautiful result screen: authenticity badge, medicine details, ownership history, risk level
- Apple-style, extremely clean and simple

## Phase 3: Full Role System + Dashboards
- Manufacturer: register, QR, transfer, view batches, recall
- Distributor: receive transfers, verify incoming, forward to pharmacy
- Pharmacy: verify incoming, scan, supply history
- Consumer: scan-only (lightweight or no auth)
- Regulator: analytics, alerts, risk map, audit, recall authority
- Auditor: immutable logs, export, ownership inspection

## Phase 4: Recall System + Batch Statuses
- Batch lifecycle: Active → Sold / Recalled / Expired
- Recall flow: manufacturer/regulator marks batch recalled
- Consumer sees "RECALLED" warning on scan
- Expiry alerts system

## Phase 5: Trust Scores + Enterprise Analytics
- Manufacturer trust score (suspicious %, verification rate, complaints)
- Enterprise analytics dashboard (scan trends, counterfeit trends, regional risk)
- Global risk map with scan locations
- Blockchain event feed (live)

## Phase 6: Additional Features
- Consumer feedback/report system (with photo upload)
- Global search (batch ID, medicine name, manufacturer, wallet)
- Report export (CSV)
- Live alerts panel with priority routing
- Replay scan protection

## Implementation Order
1. Database migrations (Phase 1)
2. Consumer verification flow (Phase 2)
3. Role dashboards (Phase 3)
4. Recall system (Phase 4)
5. Trust scores + analytics (Phase 5)
6. Additional features (Phase 6)
