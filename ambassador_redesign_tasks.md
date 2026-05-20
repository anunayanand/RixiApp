co# Ambassador Dashboard Redesign — Task Checklist

> **Reference:** Redesign `views/ambassador.ejs` to use the `intern.css` dark theme.
> Each task is small enough to implement in one go without hitting token limits.
> All EJS template variables (`ambassador.*`, `earnings`, `badge`, `referredInterns`,
> `bronzeMail`, `silverMail`, `goldMail`, `showPasswordPopup`) stay UNCHANGED.

---

## Phase 1 — HEAD Block

- [ ] **T1** Replace `<head>` contents:
  - Remove all `/js/vendor/` CSS links
  - Remove the duplicate Bootstrap import
  - Remove `main.css`
  - Add single Bootstrap 5 CDN CSS + Bootstrap Icons CDN
  - Add Google Fonts: Inter + Montserrat
  - Add `<link href="/css/intern.css" rel="stylesheet" />` zzZZZZZZZZZZZzzzzzzzzzzzz
  - Update `<title>` → `Ambassador Dashboard | Rixi Lab`
  - Keep favicon links

---

## Phase 2 — Custom `<style>` Block

- [ ] **T2** Add inline `<style>` block in `<head>` with ambassador-specific classes:
  - `.amb-badge-gold`, `.amb-badge-silver`, `.amb-badge-bronze` (colored text + glow)
  - `.amb-referral-card` (gradient background panel)
  - `.amb-referral-code` (monospace orange text)
  - `.amb-copy-btn` + `.amb-copy-btn:hover` + `.amb-copy-btn.copied`
  - `.amb-intern-row` (card-style row with left gradient border)
  - `.amb-intern-avatar` (circular initials avatar)
  - `.amb-badge-steps`, `.amb-badge-step`, `.amb-badge-step-dot`, `.amb-badge-step-label`, `.amb-badge-step-line`
  - `section-eyebrow`, `section-heading` (same as bootcamp dashboard)

---

## Phase 3 — Remove Website Header

- [ ] **T3** Delete the entire `<header id="header">` block (public website nav with Home/About/Services/Contact links + Logout).

---

## Phase 4 — Sidebar + Overlay

- [ ] **T4** Add `<div class="id-sidebar-overlay" id="sidebarOverlay"></div>` at top of `<body>`.

- [ ] **T5** Build `<aside class="id-sidebar" id="sidebar">` with:
  - Brand section: logo img + "Rixi Lab" h2 + `<span class="id-sidebar-badge">AMBASSADOR</span>`
  - Profile section (`.id-sidebar-profile`):
    - `.id-profile-img-wrap` with `data-bs-toggle="modal" data-bs-target="#updateProfileModal"`
    - `<img src="<%= ambassador.img_url %>">` 
    - Name h4, ambassador_id p
    - Stats grid: Referred count + Badge value
  - Nav (`.id-sidebar-nav`):
    - `bi-grid-1x2-fill` → Dashboard (`onclick="switchSection('dashboard', this)"`)
    - `bi-people-fill` → Interns
    - `bi-trophy-fill` → Rewards
    - `bi-file-earmark-text-fill` → Documents
    - Logout link (mobile only, danger, `data-bs-toggle="modal" data-bs-target="#logoutModal"`)
  - Footer (`.id-sidebar-footer`): support email + copyright

---

## Phase 5 — Main Content Shell + Topbar

- [ ] **T6** Wrap everything in `<main class="id-main-content">`.

- [ ] **T7** Build `<header class="id-topbar">`:
  - Left: sidebar toggle button + title h4 `id="topbarTitle"` + welcome p
  - Right: profile dropdown with avatar, name, "Update Photo", "Change Password", "Logout" items

---

## Phase 6 — Dashboard Section

- [ ] **T8** Create `<section id="dashboard" class="id-section active">`.

- [ ] **T9** Add 3 stat cards using `id-stat-card` class (Bootstrap `row g-4 mb-4`):
  - Card 1: `bi-people-fill` — "Students Referred" — `<%= ambassador.internCount %>`
  - Card 2: `bi-currency-rupee` — "Total Earnings" — `₹<%= earnings %>`
  - Card 3: `bi-award-fill` — "Badge" — `<%= badge %>` with `.amb-badge-{level}` color class

- [ ] **T10** Add 2 glass panels in a `row g-4` (`.id-glass-panel` + `.id-info-list`):
  - Left panel "College Details": University, College
  - Right panel "Personal Details": Name, Gender, Address, Joining Date, Referral Code, Discount %, Commission %

- [ ] **T11** Add Referral Share Widget (`.amb-referral-card`):
  - Icon + "Your Referral Link" label
  - Referral code display (`.amb-referral-code`)
  - Copy button with `id="copyReferralBtn"` calling `copyReferral()`
  - Share button calling existing `shareReferral()`
  - Instagram + LinkedIn icon links

---

## Phase 7 — Interns Section

- [ ] **T12** Create `<section id="interns" class="id-section">`.

- [ ] **T13** Add section header:
  ```html
  <p class="section-eyebrow">Your Network</p>
  <h2 class="section-heading">Referred Interns</h2>
  ```

- [ ] **T14** Replace the `<table>` with `.amb-intern-row` card rows:
  - For each intern: `.amb-intern-avatar` (first letter of name) + name/email block + domain badge + ₹earned + date
  - Empty state: icon + "No interns referred yet."

---

## Phase 8 — Rewards Section

- [ ] **T15** Create `<section id="rewards" class="id-section">`.

- [ ] **T16** Add badge step-progress indicator (`.amb-badge-steps`):
  - 4 steps: None → Bronze → Silver → Gold
  - Active step determined by `<%= badge %>` variable

- [ ] **T17** Add withdrawal request card (styled, replacing the old doc-card):
  - Different border color per badge level
  - Disabled button for "None", active link for "Bronze"+"

- [ ] **T18** Add bronze/silver/gold credit notification cards (conditional on `bronzeMail`, `silverMail`, `goldMail`).

---

## Phase 9 — Documents Section

- [ ] **T19** Create `<section id="documents" class="id-section">`.

- [ ] **T20** Add 2 document rows using `.id-project-card` style:
  - Offer Letter: `bi-file-earmark-text-fill` + download button → `ambassador.offer_letter_link`
  - Ambassador Certificate: `bi-file-earmark-medical-fill` + download/disabled based on `badge`

---

## Phase 10 — Modals

- [ ] **T21** Style the **Update Profile Modal** with `intern.css` dark theme:
  - `modal-content` bg: `var(--surface)`, border: `rgba(255,102,0,0.3)`
  - File input + submit button styled

- [ ] **T22** Style the **Password Change Modal** (existing `showPasswordPopup` logic kept).

- [ ] **T23** Add new **Logout Confirm Modal** (`id="logoutModal"`):
  ```html
  Are you sure you want to logout?
  [Logout →/logout] [Cancel]
  ```

---

## Phase 11 — JavaScript

- [ ] **T24** Replace ALL old JS with clean version:
  - Sidebar toggle (mobile) — same as intern.ejs
  - `switchSection(id, el)` function
  - `copyReferral(code)` — clipboard copy + button state change
  - `shareReferral(referralId)` — existing logic, keep as-is
  - Profile image preview — existing, keep
  - Password modal auto-show if `showPasswordPopup`

---

## Phase 12 — Cleanup

- [ ] **T25** Remove vendor script tags at bottom:
  - `/js/vendor/bootstrap/js/bootstrap.bundle.min.js`
  - `/js/vendor/aos/aos.js`
  - `/js/vendor/glightbox/js/glightbox.min.js`
  - `/js/vendor/purecounter/purecounter_vanilla.js`
  - `/js/vendor/typed.js/typed.umd.js`
  - `/js/vendor/swiper/swiper-bundle.min.js`
  - `/js/main.js`
  - `/js/login.js`
  - `/js/intern.js`
  - Keep only: Bootstrap 5 CDN JS bundle

- [ ] **T26** Remove `<footer id="footer">` block entirely.

- [ ] **T27** Keep `<%- include('partials/loader') %>` and `<%- include("partials/toaster") %>` includes.

---

## Quick Reference — CSS Classes from intern.css to reuse

| Class | Purpose |
|---|---|
| `id-sidebar` | Fixed left sidebar |
| `id-sidebar-brand` | Logo + title area |
| `id-sidebar-badge` | AMBASSADOR pill badge |
| `id-sidebar-profile` | Profile section |
| `id-profile-img-wrap` | Gradient ring around avatar |
| `id-sidebar-profile-stats` | 2-col stats grid |
| `id-sidebar-nav` | Nav links container |
| `id-sidebar-footer` | Bottom support text |
| `id-main-content` | Main area (margin-left: sidebar-w) |
| `id-topbar` | Sticky glassmorphism header |
| `id-topbar-btn` | Circle icon buttons |
| `id-content-body` | Content padding wrapper |
| `id-section` | Hidden section (`.active` shows it) |
| `id-stat-card` | Claymorphism stat card |
| `id-stat-icon` | Circular icon in stat card |
| `id-stat-title` | Label in stat card |
| `id-stat-value` | Big number in stat card |
| `id-glass-panel` | Glassmorphism info panel |
| `id-panel-title` | Panel heading with icon |
| `id-info-list` | `<ul>` key-value list |
| `id-info-label` | Left column label |
| `id-info-value` | Right column value |
| `id-project-card` | Card row with left border |
| `btn-primary-custom` | Orange filled button |
| `btn-outline-primary-custom` | Orange outline button |

---

## Progress

- [x] Implementation plan created (`ambassador_redesign_plan.md` in artifacts)
- [ ] T1 — T27 above

> Start with **T1 → T5** to get the shell working, then section by section.
