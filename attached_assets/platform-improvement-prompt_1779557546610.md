# 🚀 Platform Improvement Prompt
## Inspired by ApplyBoard's UX/Data Architecture — Built on Your Existing Foundation

> **Context for your developer:** The existing platform (scholarships discovery + admin dashboard) is already built. This prompt covers ONLY what needs to be added or improved. Do NOT rebuild anything from scratch. All improvements must layer on top of the current system.

---

## 🧩 PART 1 — STUDENT PROFILE & ELIGIBILITY ENGINE

ApplyBoard's most powerful feature is that students create a profile ONCE, and the platform then auto-filters every opportunity to only show what they qualify for. Add this to your platform.

### 1A. Student Account System
Add a lightweight student-facing account (separate from admin):

```
New routes:
  /register         → student sign-up
  /login            → student login  
  /dashboard        → student personal dashboard
  /profile          → student profile editor
```

**Student profile fields to capture at sign-up (multi-step wizard, not one long form):**

Step 1 — Background:
- Full name
- Nationality / Country of origin
- Current country of residence
- Date of birth / Age

Step 2 — Education:
- Highest education level completed (High School / Bachelor's / Master's / PhD)
- Field of study / Major
- Current GPA (or equivalent: First Class / 2:1 / 2:2 / Pass)
- Expected graduation year (if still enrolled)

Step 3 — Goals:
- Desired study level (Undergraduate / Masters / PhD / Short Course / Any)
- Preferred destination country (multi-select)
- Field of interest for next program
- Study timeline (Starting: 2025 / 2026 / Not sure)

Step 4 — Language & Documents:
- English proficiency (Native / IELTS score / TOEFL score / Not yet tested)
- Passport country
- Do you have a current student visa? (Yes/No)

**Database additions:**
```sql
-- New table: student_profiles
id              UUID PRIMARY KEY
user_id         UUID REFERENCES auth.users
nationality     TEXT
residence       TEXT
education_level TEXT
gpa             DECIMAL
field_of_study  TEXT
ielts_score     DECIMAL
toefl_score     INTEGER
target_level    TEXT[]
target_country  TEXT[]
target_field    TEXT
visa_status     TEXT
created_at      TIMESTAMP DEFAULT now()
updated_at      TIMESTAMP DEFAULT now()
```

---

### 1B. Eligibility Matching Engine
Once a student has a profile, auto-calculate and display eligibility on each opportunity card.

**Add new fields to the `opportunities` table:**
```sql
-- Add to existing opportunities table:
min_gpa             DECIMAL          -- e.g. 3.0
eligible_countries  TEXT[]           -- null = all countries welcome
ineligible_countries TEXT[]          -- countries explicitly excluded
required_level      TEXT[]           -- ['masters', 'phd']
required_field      TEXT[]           -- ['stem', 'medicine'] — null = any
min_english_ielts   DECIMAL          -- e.g. 6.5
age_min             INTEGER
age_max             INTEGER
gender_restriction  TEXT             -- null = all, 'female', 'male'
```

**Frontend behavior:**
- If student is logged in → each card shows an eligibility badge:
  - 🟢 **"You qualify"** — all criteria met
  - 🟡 **"Likely eligible"** — most criteria met, 1 unverifiable
  - 🔴 **"Check requirements"** — one or more criteria not met
  - ⚪ **"Complete your profile"** — not enough info to determine

- On the detail page, show a **"Your Eligibility" panel**:
  ```
  ✅ Education level: You have a Bachelor's — Required: Bachelor's
  ✅ GPA: Yours 3.4 — Minimum: 3.0
  ✅ Country: Rwanda is eligible
  ⚠️  English: IELTS 6.5 required — Not on your profile yet
  ```
  With a CTA: [Complete your profile to see full eligibility →]

- **Search filter behavior:** Add toggle "Only show opportunities I qualify for" — filters results using stored profile.

---

## 🧩 PART 2 — APPLYBOARD-STYLE PROGRAM TAGS

ApplyBoard adds smart visual tags to each program card (Fast Acceptance, Scholarships Available, No Visa Cap, STEM, etc.). Add this tagging system.

### 2A. Smart Tags System

**New tags to add to opportunities:**
```
⚡ Fast Response      — admin marks: response < 2 weeks
💰 Fully Funded       — already exists, make it a tag
🌍 Open to All        — no country restrictions
👩 Women Only         — gender restriction
🏆 Highly Competitive — acceptance rate < 15%
🆕 Just Added         — posted within last 7 days (auto)
⏰ Closing Soon       — deadline within 14 days (auto)
🔥 Popular            — 500+ views (auto)
📋 No Essay Required  — admin marks
🎓 STEM               — category tag
🌱 Africa Focus       — regional tag
```

**Admin editor update:** Add a "Tags" multi-select in the post editor sidebar. Auto-tags (Just Added, Closing Soon, Popular) are system-generated. Manual tags are selected by editors.

**Card UI update:** Show up to 3 tags below the category/country line on each card. Tags use pill design with distinct colors per category.

---

## 🧩 PART 3 — "APPLY THROUGH US" MANAGED APPLICATION FLOW

This is the ApplyBoard feature that appears when students select your platform to handle their application. It replaces the current "Apply Now → external link" with a managed funnel.

### 3A. Apply Intent Selection
On each opportunity detail page, replace the current single "Apply Now" button with a two-option selector:

```
┌──────────────────────────────────────────┐
│  How would you like to apply?            │
│                                          │
│  ┌─────────────────┐  ┌──────────────┐  │
│  │  🔗 Apply       │  │  🤝 Apply    │  │
│  │  Directly       │  │  With Us     │  │
│  │                 │  │              │  │
│  │  Go to the      │  │  We guide    │  │
│  │  official site  │  │  you through │  │
│  │  yourself       │  │  the whole   │  │
│  │                 │  │  process     │  │
│  └─────────────────┘  └──────────────┘  │
└──────────────────────────────────────────┘
```

**"Apply Directly"** → existing behavior, opens `apply_link` in new tab.

**"Apply With Us"** → triggers the managed flow below.

---

### 3B. Managed Application Flow (New Modal/Page)

When student clicks "Apply With Us":

**Step 1 — Confirm Interest (Modal)**
```
"You're applying to: [Opportunity Title]"
Deadline: [Date] — [X days away]

To get started, we need a few details.
[Continue →]  [I'll apply directly instead]
```

If not logged in → prompt to create account or log in first.
If logged in → skip to Step 2.

**Step 2 — Profile Completeness Check**
```
Before we submit, we need your profile to be complete.

✅ Basic info
✅ Education history  
⚠️  English test scores — [Add now]
⚠️  Documents not uploaded — [Upload now]

[Save & Continue →]
```

**Step 3 — Application Intake Form**
Collect what your team needs to help the student:
```
Fields:
- Motivation (why this scholarship?) — textarea
- Relevant experience — textarea
- Documents upload: CV, Transcript, Passport, SOP (if applicable)
- Preferred contact method: WhatsApp / Email
- WhatsApp number (pre-fill from profile)
- Best time to contact: [Morning / Afternoon / Evening]
- Any specific concerns? — optional textarea
```

**Step 4 — Confirmation**
```
✅ Application received!

What happens next:
1. Our team reviews your profile within 24–48 hours
2. We contact you on WhatsApp to confirm documents
3. We prepare and submit your application
4. You get updates at every stage

[View My Applications →]  [Back to Browse →]
```

**Database additions:**
```sql
-- New table: managed_applications
id                  UUID PRIMARY KEY
student_id          UUID REFERENCES student_profiles
opportunity_id      UUID REFERENCES opportunities
status              TEXT  -- pending_review, in_progress, submitted, rejected, accepted
motivation          TEXT
experience          TEXT
contact_preference  TEXT
whatsapp_number     TEXT
contact_time        TEXT
concerns            TEXT
assigned_to         UUID REFERENCES users  -- admin team member
documents           JSONB  -- array of uploaded file URLs
notes               TEXT  -- internal admin notes
created_at          TIMESTAMP DEFAULT now()
updated_at          TIMESTAMP DEFAULT now()
```

---

### 3C. Student Application Tracker (Dashboard)
Add `/dashboard` page for logged-in students showing:

```
MY APPLICATIONS

┌─────────────────────────────────────────────────────┐
│  Gates Cambridge Scholarship 2025                   │
│  Status: 🔵 In Progress — Our team is reviewing    │
│  Submitted: Jan 15, 2025                            │
│  Handler: Sarah (your advisor)                      │
│  [View Details]  [Message Advisor]                  │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  Chevening Scholarship                              │
│  Status: ✅ Submitted to Institution               │
│  Submitted: Jan 10, 2025                            │
│  [View Details]                                     │
└─────────────────────────────────────────────────────┘
```

Status pipeline:
```
Pending Review → Profile Check → Documents Collection → In Progress → Submitted → Outcome
```

---

## 🧩 PART 4 — ADMIN: MANAGED APPLICATIONS PANEL

Add a new section to the admin dashboard to handle incoming managed applications.

### 4A. New Admin Sidebar Item
```
Admin sidebar, add after "All Posts":
  📥 Applications (with unread badge count)
    ↳ New Requests
    ↳ In Progress
    ↳ Submitted
    ↳ All Applications
```

### 4B. Applications Table (`/admin/applications`)
```
Columns:
  Student Name | Opportunity | Status | Documents | Handler | Date | Actions

Row actions:
  [Review] [Assign to Me] [Update Status] [Message Student]

Filters:
  Status | Handler | Opportunity | Date range
```

### 4C. Application Detail View (`/admin/applications/[id]`)
```
Layout: Two-column

LEFT — Student Info:
  Name, nationality, education level, GPA, English score
  Contact: WhatsApp + Email
  "View Full Profile" link

  Application motivation (from intake form)
  Experience notes
  Concerns

  Uploaded documents:
  [CV.pdf] [Transcript.pdf] [Passport.jpg] — preview + download each

RIGHT — Actions Panel:
  Current Status: [dropdown to update]
  Assigned Handler: [dropdown of team]
  Internal Notes: [textarea — not visible to student]

  [Send WhatsApp Message →]  — opens wa.me with student number pre-filled
  [Mark as Submitted]
  [Mark as Accepted 🎉]
  [Mark as Rejected]

  Timeline:
  Jan 15 — Application received
  Jan 16 — Assigned to Sarah
  Jan 17 — Documents verified
  Jan 18 — Submitted to institution
```

---

## 🧩 PART 5 — AI-POWERED FEATURES (ApplyBoard's "Abbie" equivalent)

### 5A. Smart Scholarship Finder (Quiz Flow)
Add a "Find Scholarships For Me" flow as an alternative entry to browsing.

**Route:** `/find-my-scholarship`

**Flow — 6 question quiz:**
```
Q1: What level are you applying for?
    [Undergraduate] [Masters] [PhD] [Professional Course]

Q2: What field do you want to study?
    [Text input with autocomplete: Engineering / Business / Medicine / Law / Arts / Other]

Q3: Where do you want to study?
    [Multi-select: USA / UK / Canada / Europe / Australia / Anywhere]

Q4: What's your current GPA/result?
    [First Class / 2:1 / 2:2 / Pass / 70%+ / 60-70% / Below 60%]

Q5: Do you have English test scores?
    [Yes, IELTS 7+] [Yes, IELTS 6-6.5] [TOEFL 90+] [Not yet tested]

Q6: When do you want to start?
    [This year] [Next year] [Just exploring]
```

After quiz → show filtered, ranked results with match percentage:
```
✨ We found 24 scholarships that match your profile

[Card] Gates Cambridge Scholarship — 94% match
[Card] Commonwealth Scholarship — 87% match
[Card] Chevening — 82% match
```

**Implementation:** This is a frontend filter, not AI at first. Use quiz answers to filter the `opportunities` table server-side. Add an optional Claude API call to generate a personalized 2-sentence recommendation summary for the top 3 results.

---

### 5B. AI Summary Button (Admin Editor)
In the admin post editor, add a button next to the rich text editor:

```
[✨ Auto-generate description from title]
```

When clicked → call Claude API with the opportunity title + category + country → returns:
- A 2-sentence card teaser (populates the `description` field)
- A suggested set of tags

**Implementation:**
```javascript
// In admin post editor component:
const generateDescription = async () => {
  const response = await fetch('/api/ai/generate-description', {
    method: 'POST',
    body: JSON.stringify({ title, category, country, funding_type })
  });
  const { description, tags } = await response.json();
  setDescription(description);
  setSuggestedTags(tags);
};
```

Backend route calls Claude API (`claude-sonnet-4-20250514`) with a tight prompt asking for structured JSON output.

---

## 🧩 PART 6 — DATA & SEARCH IMPROVEMENTS

### 6A. Scholarship Data Enrichment Fields
Add these fields to the `opportunities` table to improve filtering (inspired by ApplyBoard's program data depth):

```sql
-- Add to opportunities table:
host_organization    TEXT    -- "Harvard University" / "UN" / "Gates Foundation"
host_website         TEXT    -- official institution URL
scholarship_type     TEXT    -- merit, need-based, government, university, private
renewable            BOOLEAN -- can be renewed each year?
number_of_awards     INTEGER -- how many students receive it
application_fee      DECIMAL -- 0 = free to apply
interview_required   BOOLEAN
essay_required       BOOLEAN
reference_letters    INTEGER -- number required (0, 1, 2, 3)
notification_date    DATE    -- when results are announced
program_duration     TEXT    -- "1 year", "2 years", "4 years"
```

**Admin editor:** Add these as optional fields in a collapsible "Advanced Details" section of the post editor sidebar.

### 6B. Advanced Search Filters
Add to the browse page filter panel:
```
New filters:
  □ No Application Fee
  □ No Interview Required
  □ No Essay Required
  □ Renewable Scholarship
  □ Results Announced Before: [date picker]
  
  Reference letters required:
    (•) Any  ( ) 0  ( ) 1  ( ) 2  ( ) 3+

  Number of awards:
    [Slider: 1 ————— 1000+]
```

### 6C. Comparison Tool
Allow students to compare up to 3 opportunities side-by-side.

**Behavior:**
- Each card gets a checkbox: `☐ Compare`
- Selecting 2–3 shows a sticky bottom bar: `Comparing 2 opportunities [Compare Now →]`
- Opens `/compare?ids=xxx,yyy,zzz` — a table comparing all key fields side by side

---

## 🧩 PART 7 — RECRUITMENT PARTNER / AGENT SYSTEM (Optional Phase 2)

ApplyBoard's B2B side connects recruitment agents (like your team) to institutions. You can replicate a lightweight version.

### 7A. Agent/Advisor Profiles (Public)
Each admin team member gets a public profile page:
```
Route: /advisors/[name]

Profile shows:
  - Name + photo
  - Specialization: "UK & USA Scholarships"
  - Opportunities they've posted (with credit)
  - Students helped count (visible after you collect data)
  - [Book a WhatsApp consultation] button
```

### 7B. Lead Capture Form (Embeddable)
Generate an embeddable widget for each advisor that captures student leads:
```
Route: /advisors/[name]/intake

Short form:
  - Name
  - Country
  - Education level
  - Which scholarship they're interested in
  - WhatsApp number
  - [Get Help →]

On submit → creates a managed_application record with status: "lead"
         → auto-sends WhatsApp message to the advisor
```

Generates embed code that advisors can put on their own social media link-in-bio pages.

---

## 🧩 PART 8 — NOTIFICATIONS & RETENTION

### 8A. Email/WhatsApp Alerts for Saved Opportunities
Students can save (bookmark) opportunities. When:
- Deadline is 7 days away → send WhatsApp reminder
- A new opportunity matches their profile → send "New match" alert
- Managed application status changes → send update

**Implementation:** Cron job (daily) queries:
1. Opportunities with `deadline = today + 7` where students have saved it
2. New opportunities published today, matched against student profiles
3. `managed_applications` with `updated_at > yesterday`

Dispatch via WhatsApp Business API or a service like Twilio.

### 8B. "Closing Soon" Email Digest
Weekly email to all newsletter subscribers: "This week's closing deadlines + fresh opportunities."

---

## 🧩 PART 9 — VISUAL / UX POLISH (ApplyBoard-inspired)

### 9A. Split-Panel Browse Layout (Desktop)
ApplyBoard uses a two-column layout: filters + cards on left, detail preview on right.
Add this as an optional view toggle on `/browse`:

```
View toggle: [Grid View] [Split View]

Split View:
┌──────────────────────┬──────────────────────────────────┐
│  FILTERS             │  DETAIL PREVIEW                  │
│  ─────────────────   │                                  │
│  [Card 1] ← active   │  [Full detail of Card 1          │
│  [Card 2]            │   shows here without             │
│  [Card 3]            │   navigating away]               │
│  [Card 4]            │                                  │
└──────────────────────┴──────────────────────────────────┘
```

### 9B. Success Prediction Score (Gamified Eligibility)
On the detail page sidebar, after the student completes their profile, show:

```
📊 Your Success Estimate
━━━━━━━━━━━━━━━━━━━━━
██████████░░░░  72%

Based on: GPA match ✅ Country ✅ Level ✅ English ⚠️
"Your profile is strong. Strengthen your English test score to improve your chances."
[Improve My Profile →]
```

This is a **calculated score**, not AI — just weighted criteria matching:
- GPA meets minimum: +25 pts
- Country eligible: +25 pts
- Level matches: +20 pts
- English score meets: +20 pts
- Field matches: +10 pts

---

## 📋 IMPLEMENTATION PRIORITY ORDER

```
Priority 1 (Core — Do First):
  ✅ Student account + profile system (Part 1A)
  ✅ "Apply With Us" flow + intake form (Part 3A, 3B)
  ✅ Admin: Managed Applications panel (Part 4)

Priority 2 (Engagement — Do Second):
  ✅ Eligibility matching on cards (Part 1B)
  ✅ Smart tags system (Part 2)
  ✅ Student application tracker dashboard (Part 3C)

Priority 3 (Intelligence — Do Third):
  ✅ AI Scholarship Finder quiz (Part 5A)
  ✅ AI description generator in admin (Part 5B)
  ✅ Advanced search fields + filters (Part 6A, 6B)

Priority 4 (Scale — Do Later):
  ✅ Comparison tool (Part 6C)
  ✅ Agent profiles + embeddable intake (Part 7)
  ✅ WhatsApp notifications + alerts (Part 8)
  ✅ Split-panel browse + success score (Part 9)
```

---

## 🔑 KEY PRINCIPLE

> The existing platform is a **discovery tool**.
> These improvements turn it into an **application management platform**.
> The ApplyBoard flow only activates when a student explicitly chooses "Apply With Us."
> Students who prefer to apply directly still get the full original experience unchanged.

---

*Improvement Prompt v1.0 — Layered onto existing ScholarPath/OpportuNest build.*
*Zero existing features are removed or replaced.*
