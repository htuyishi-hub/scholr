# 🎓 Scholarships & Opportunities Platform — Complete Design & Build Prompt

> A full-stack design specification for a multi-editor scholarship listing platform.
> Hand this to your developer or use it directly as a coding prompt.

---

## 🧠 VISION & CONCEPT

**Name Idea:** *OpportuNest* / *ScholarPath* / *FundedFutures* (pick yours)

**Core Concept:** A premium, editorial-magazine-style platform where opportunities are presented like curated stories — not boring lists. Multiple team members can log in to an admin dashboard and post, edit, and manage scholarships. Visitors get a clean, searchable discovery experience with direct links and instant WhatsApp help.

**Design Inspiration Mix:**
- **Notion** (clean cards, tag system)
- **Behance** (visual-first hero images on each card)
- **Opportunity Desk** (functional category filters)
- **Linear.app** (dark admin dashboard, sharp UI)
- **Forbes** (editorial feel for the public-facing side)

---

## 🎨 DESIGN SYSTEM

### Color Palette
```
Primary Background:   #0A0F1E  (deep navy — public site)
Card Background:      #111827
Accent Gold:          #F59E0B  (opportunity = gold)
Accent Green:         #10B981  (fully funded badge)
Accent Blue:          #3B82F6  (deadlines, links)
Text Primary:         #F9FAFB
Text Secondary:       #9CA3AF
WhatsApp Green:       #25D366
Admin Background:     #F8FAFC  (light mode for admin)
Admin Sidebar:        #1E293B
Danger Red:           #EF4444
```

### Typography
```
Display/Hero Font:    "Playfair Display" (Google Fonts) — serif, editorial
Body Font:            "DM Sans" (Google Fonts) — clean, modern
Monospace (tags):     "JetBrains Mono" — for deadlines/dates
```

### Spacing System (8px base)
```
xs: 4px | sm: 8px | md: 16px | lg: 24px | xl: 32px | 2xl: 48px | 3xl: 64px
```

---

## 🌐 PUBLIC-FACING WEBSITE

### PAGE 1 — Homepage (`/`)

#### Hero Section
```
Layout: Full-width dark hero, 80vh height
Background: Animated gradient mesh (navy → dark purple → navy)
           + subtle floating orbs animation in CSS

Content:
  - Tagline: "Your Next Opportunity is One Click Away"  [Playfair Display, 56px bold]
  - Subtitle: "Browse scholarships, fellowships, and grants curated for you."  [DM Sans, 18px, gray]
  - Search bar: Large pill-shaped input (full-width on mobile) with category dropdown + "Search" button
  - Stats row below: [2,400+ Opportunities] [45 Countries] [Updated Daily]
  - Background image: blurred collage of graduation caps, students, globes — overlaid with 60% dark
```

#### Filter Bar (sticky on scroll)
```
Position: Sticky below navbar, white/dark bar
Filters:
  - Category pills: All | Scholarships | Fellowships | Grants | Internships | Conferences | Competitions
  - Country dropdown
  - Funding type: Fully Funded | Partial | Free Entry
  - Deadline: Soon (7 days) | This Month | Open
  - Sort: Latest | Deadline Soonest | Most Viewed

Mobile: Horizontal scrollable pills
```

#### Opportunity Cards Grid
```
Layout: 3 columns desktop, 2 tablet, 1 mobile
Card Design:
  ┌─────────────────────────────────┐
  │  [HERO IMAGE — 16:9 aspect]     │
  │  [BADGE: FULLY FUNDED] [BADGE: NEW] │
  ├─────────────────────────────────┤
  │  🌍 Country • 🏷️ Category       │
  │                                 │
  │  [Title — Playfair Display 20px]│
  │  [Short description — 2 lines]  │
  │                                 │
  │  ⏰ Deadline: Dec 31, 2025      │
  │  💰 Amount: Full Tuition + Stipend│
  │                                 │
  │  [Apply Now →]  [💬 Get Help]   │
  └─────────────────────────────────┘

Card interactions:
  - Hover: card lifts with box-shadow, image scales 1.05x
  - Badge colors: Green (Fully Funded), Blue (Open), Orange (Closing Soon), Red (Last 3 Days)
```

#### Featured Section
```
Layout: 1 large featured card (left, 60%) + 2 stacked smaller cards (right, 40%)
Labeled: "⭐ Editor's Picks This Week"
Large card has gradient overlay text on image
```

#### Newsletter / WhatsApp Community Banner
```
Full-width dark section:
"Never Miss an Opportunity"
[Enter your email — Subscribe] button
OR
[Join WhatsApp Channel] — opens wa.me link
```

---

### PAGE 2 — Opportunity Detail (`/opportunity/[slug]`)

```
Layout: Two columns — Content (65%) | Sidebar (35%)

LEFT COLUMN:
  - Hero image (full width, rounded corners, 400px height)
  - Breadcrumb: Home > Scholarships > [Country]
  - Title (Playfair Display, 36px)
  - Meta row: 📅 Posted: Jan 5 | 👁️ 1.2k views | 🔗 Share buttons
  - Badge row: [Fully Funded] [Undergraduate] [International]
  
  Sections (with anchor nav):
  - About the Opportunity
  - Eligibility Criteria (bulleted)
  - Benefits / Award Details
  - How to Apply
  - Required Documents
  - Important Dates (timeline visual)
  - Tips from Our Team (optional)

RIGHT SIDEBAR (sticky):
  ┌────────────────────────┐
  │  ⏰ Deadline           │
  │  December 31, 2025     │
  │  [Countdown Timer]     │
  │                        │
  │  [🔗 APPLY NOW]        │
  │  (gold button, full w) │
  │                        │
  │  [💬 Need Help?        │
  │   Chat on WhatsApp]    │
  │  (green button, full w)│
  │                        │
  │  📌 Quick Facts        │
  │  Country: USA          │
  │  Level: Masters/PhD    │
  │  Funding: Full         │
  │  Host: Harvard Univ.   │
  └────────────────────────┘

  Below sidebar: Related Opportunities (3 cards)
```

---

### PAGE 3 — Browse / Search Results (`/browse`)
```
- Left sidebar: full filter panel (permanent, collapsible on mobile)
- Right: grid of cards
- Pagination or infinite scroll
- Result count: "Showing 24 of 847 opportunities"
- Empty state: illustrated "No results found — try different filters"
```

---

### PAGE 4 — About / Contact (`/about`)
```
- Team mission paragraph
- WhatsApp button: "Chat with us for help with applications"
- Social links
```

---

## 🔐 ADMIN DASHBOARD (`/admin`)

### Admin Login Page
```
Layout: Centered card on dark background
Fields: Email + Password
Auth: JWT or session-based (you implement)
Multi-user: Each team member has their own account
```

### Admin Sidebar Navigation
```
Dark sidebar (#1E293B):
  🏠 Dashboard
  ➕ New Post
  📋 All Posts
  📂 Drafts
  🏷️ Categories
  👥 Team Members
  📊 Analytics
  ⚙️ Settings
  🚪 Logout
```

### Dashboard Home (`/admin/dashboard`)
```
Stats cards row:
  [Total Posts: 347] [Published: 312] [Drafts: 35] [This Month: 28]

Charts:
  - Posts per month (bar chart)
  - Views by category (donut chart)
  - Top 5 most viewed posts (list)

Recent Activity feed:
  "John posted 'Gates Scholarship 2025' — 2 hours ago"
  "Sarah updated 'UN Fellowship' — Yesterday"
```

### New Post / Edit Post (`/admin/posts/new`)

```
FULL EDITOR LAYOUT:

┌─────────────────────────────────────────────────────────┐
│  HEADER: [← Back] [Save Draft] [Preview] [Publish]      │
├──────────────────────────────┬──────────────────────────┤
│                              │  SIDEBAR FIELDS           │
│  MAIN CONTENT AREA           │                           │
│                              │  Status: [Draft/Published]│
│  [TITLE INPUT — large]       │  Category: [dropdown]     │
│  e.g. "Gates Scholarship..." │  Country: [dropdown]      │
│                              │  Funding Type: [dropdown] │
│  [SLUG — auto-generated]     │  Study Level: [multi-sel] │
│                              │                           │
│  [COVER IMAGE UPLOADER]      │  Deadline: [date picker]  │
│  Drag & drop or click        │  Amount: [text]           │
│  Shows preview after upload  │                           │
│  Supports: JPG, PNG, WebP    │  Direct Apply Link:       │
│                              │  [URL input]              │
│  [RICH TEXT EDITOR]          │                           │
│  (Quill.js or TipTap)        │  WhatsApp Number:         │
│  Toolbar:                    │  [+1234567890 format]     │
│  Bold Italic H1 H2 H3        │  (pre-fill default number)│
│  Lists | Quote | Link        │                           │
│  Table | Image               │  Tags: [tag input]        │
│  Custom blocks:              │  e.g. stem, women, africa │
│   - Eligibility block        │                           │
│   - Benefits block           │  SEO Title: [input]       │
│   - Dates timeline           │  Meta Description: [text] │
│   - Quick Facts table        │                           │
│                              │  Author: [auto-filled]    │
│                              │  (your logged-in name)    │
│                              │                           │
│                              │  Featured Post? [toggle]  │
│                              │  Pin to top? [toggle]     │
└──────────────────────────────┴──────────────────────────┘
```

### All Posts Table (`/admin/posts`)
```
Columns:
  [ ] | Cover Thumb | Title | Category | Status | Author | Deadline | Views | Actions

Actions per row:
  [Edit] [Preview] [Duplicate] [Delete]

Bulk actions:
  Select multiple → [Publish All] [Delete All] [Change Category]

Filters:
  Status: All | Published | Draft | Archived
  Author: All | [dropdown of team members]
  Date range picker
  Search by title
```

### Team Members (`/admin/team`)
```
Table: Name | Email | Role | Posts Published | Last Active | Actions
Roles: Admin (full access) | Editor (create/edit own posts) | Viewer (read only)
[+ Invite Member] button → sends invite email with temp password
```

---

## 📱 MOBILE EXPERIENCE

```
Navbar: Hamburger menu → slide-in drawer
Cards: Single column, full width
Detail page: Sidebar becomes sticky bottom bar
  [Apply Now] [WhatsApp Help] — always visible at bottom

WhatsApp button: Floating Action Button (bottom-right) on all public pages
  Icon: WhatsApp logo, green, 56x56px circle with shadow
  Tap → opens: https://wa.me/[YOURNUMBER]?text=Hi, I need help with [page title]
```

---

## 🔗 KEY FUNCTIONAL FEATURES

### 1. Apply Now Button
```javascript
// Each post stores: apply_link (external URL)
// Button behavior:
<a href={post.apply_link} target="_blank" rel="noopener noreferrer">
  Apply Now →
</a>
// Opens in new tab, never hijacks current page
```

### 2. WhatsApp Help Button
```javascript
// Each post can override default WhatsApp number
// URL format:
const whatsappURL = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
  `Hi! I need help applying to: ${post.title}`
)}`;
// This pre-fills message with the opportunity name — super helpful!
```

### 3. Deadline Countdown
```javascript
// Show on card & detail page:
// "3 days left" — red
// "2 weeks left" — orange  
// "1+ month" — green
// "Expired" — gray, card dimmed
```

### 4. Image Upload (Admin)
```
- Drag-and-drop zone OR click-to-browse
- Accept: image/jpeg, image/png, image/webp
- Max size: 5MB
- Auto-resize to 1200x630px (Open Graph standard)
- Store in: /uploads/ or Cloudinary / Supabase Storage
- Show preview immediately after upload
- Alt text field for accessibility
```

### 5. Multi-Editor System
```
Each team member:
  - Has unique login (email + password)
  - Can create/edit their own posts
  - Admins can edit anyone's posts
  - All posts show "Posted by [Name]"
  - Activity log tracks who did what
```

---

## 🧱 RECOMMENDED TECH STACK

### Option A — Simple & Fast (Recommended for solo/small team)
```
Frontend:  Next.js 14 (App Router) + Tailwind CSS
Database:  Supabase (PostgreSQL + Auth + Storage — FREE tier available)
Images:    Supabase Storage or Cloudinary
Rich Text: TipTap editor (free, extensible)
Auth:      Supabase Auth (email/password, multi-user)
Deploy:    Vercel (free tier)
```

### Option B — CMS-Based (Even simpler posting)
```
Frontend:  Next.js + Tailwind CSS
CMS:       Sanity.io or Payload CMS
Auth:      Built into CMS (multiple editors out of box)
Deploy:    Vercel
```

### Option C — Full Custom
```
Frontend:  React + Tailwind CSS
Backend:   Node.js + Express or Django
Database:  PostgreSQL or MongoDB
Auth:      JWT tokens
Storage:   AWS S3 or Cloudinary
Deploy:    Railway / Render / VPS
```

---

## 🗄️ DATABASE SCHEMA

### `opportunities` table
```sql
id              UUID PRIMARY KEY
title           TEXT NOT NULL
slug            TEXT UNIQUE NOT NULL
description     TEXT                    -- short teaser (max 300 chars)
content         TEXT (or JSONB)         -- rich text / TipTap JSON
cover_image     TEXT                    -- URL to image
category        TEXT                    -- scholarship, fellowship, etc.
country         TEXT
funding_type    TEXT                    -- full, partial, free
study_level     TEXT[]                  -- ['undergraduate', 'masters']
deadline        DATE
amount          TEXT                    -- "Full Tuition + $25,000 stipend"
apply_link      TEXT                    -- external URL
whatsapp_number TEXT                    -- override default
tags            TEXT[]
status          TEXT DEFAULT 'draft'    -- draft, published, archived
featured        BOOLEAN DEFAULT false
pinned          BOOLEAN DEFAULT false
views           INTEGER DEFAULT 0
author_id       UUID REFERENCES users
created_at      TIMESTAMP DEFAULT now()
updated_at      TIMESTAMP DEFAULT now()
```

### `users` table (admin team)
```sql
id          UUID PRIMARY KEY
name        TEXT
email       TEXT UNIQUE
role        TEXT    -- admin, editor, viewer
avatar_url  TEXT
created_at  TIMESTAMP
```

### `settings` table
```sql
key         TEXT PRIMARY KEY
value       TEXT
-- e.g.: default_whatsapp = "+1234567890"
--       site_name = "ScholarPath"
--       contact_email = "help@scholarpath.com"
```

---

## ⚙️ SETTINGS PAGE (`/admin/settings`)

```
General:
  - Site Name
  - Site Tagline
  - Logo upload
  - Favicon upload

Contact:
  - Default WhatsApp Number (used on all posts without override)
  - Contact Email
  - Social links (Twitter, Instagram, Telegram, Facebook)

SEO:
  - Default Meta Description
  - Google Analytics ID
  - Facebook Pixel ID

Display:
  - Posts per page (12 / 24 / 48)
  - Default category sort order
  - Enable/disable comments
```

---

## 🎯 NICE-TO-HAVE FEATURES (Phase 2)

```
✅ Bookmark / Save opportunities (localStorage or user account)
✅ Email alerts for new posts matching saved filters
✅ WhatsApp broadcast integration
✅ Application tracker (user marks "Applied", "Pending", "Got it!")
✅ Telegram bot posting (auto-share new opportunities)
✅ Google Sheets integration (export opportunities list)
✅ Multi-language support (FR, AR, PT for Africa/MENA markets)
✅ AI-generated summary button (in admin, one-click summarize long content)
✅ View analytics per post
```

---

## 📐 WIREFRAME SUMMARY (Visual Layout)

```
PUBLIC HOMEPAGE:
┌──────────────────────────────────────────────┐
│  NAVBAR: Logo | Browse | About | 💬 WhatsApp │
├──────────────────────────────────────────────┤
│                                              │
│         HERO — Search Bar — Stats            │
│                                              │
├──────────────────────────────────────────────┤
│  [All][Scholarship][Fellowship][Grant][More] │  ← Filter pills
├──────────────────────────────────────────────┤
│  ⭐ FEATURED: Big card (left) + 2 small      │
├──────────────────────────────────────────────┤
│  LATEST POSTS:                               │
│  [Card][Card][Card]                          │
│  [Card][Card][Card]                          │
│  [Card][Card][Card]                          │
│  [Load More / Pagination]                    │
├──────────────────────────────────────────────┤
│  NEWSLETTER / WHATSAPP COMMUNITY BANNER      │
├──────────────────────────────────────────────┤
│  FOOTER: Links | Social | WhatsApp | Copy    │
└──────────────────────────────────────────────┘
                          [💬 WhatsApp FAB]  ←── always visible

ADMIN DASHBOARD:
┌──────────┬───────────────────────────────────┐
│  SIDEBAR │  MAIN CONTENT AREA                 │
│          │                                   │
│ Dashboard│  Stats | Charts | Recent Posts    │
│ New Post │                                   │
│ All Posts│                                   │
│ Drafts   │                                   │
│ Team     │                                   │
│ Settings │                                   │
│ Logout   │                                   │
└──────────┴───────────────────────────────────┘
```

---

## 💬 WHATSAPP INTEGRATION DETAILS

```
Floating Button (all public pages):
  Position: fixed, bottom: 24px, right: 24px
  Size: 60px circle
  Color: #25D366 (official WhatsApp green)
  Icon: WhatsApp SVG logo (white)
  Shadow: 0 4px 20px rgba(37, 211, 102, 0.4)
  Tooltip on hover: "Need help? Chat with us"
  
  Link: https://wa.me/[YOUR_NUMBER]?text=Hello!%20I%20need%20help%20with%20a%20scholarship%20application.

Detail Page Sidebar Button:
  Full-width green button
  Pre-fills message with opportunity title:
  https://wa.me/[NUMBER]?text=Hi!%20I%20need%20help%20applying%20to%20[TITLE]

Admin Settings:
  Default number editable in /admin/settings
  Each post can override with a different helper's number
  (useful if different team members handle different regions/types)
```

---

## 🚀 LAUNCH CHECKLIST

```
□ Domain connected (e.g., scholarpath.com)
□ HTTPS enabled (auto via Vercel/Netlify)
□ SEO: sitemap.xml auto-generated
□ SEO: Open Graph meta tags on each post (title + cover image)
□ Google Analytics connected
□ WhatsApp number tested (click → opens WhatsApp)
□ Apply link tested (opens in new tab)
□ Mobile tested on Android + iOS
□ Admin invite emails working
□ Image upload tested (drag-drop + click)
□ Deadline countdown tested
□ First 10 posts published
```

---

*Document prepared for development handoff. All sections are implementation-ready.*
*Version 1.0 — Ready to build.*
