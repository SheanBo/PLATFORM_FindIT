# 🎨 FindIT Design & Typography Guide

## Typography System

### Font Pairing
- **Display (Headings, Buttons, Labels)**: Inter 700/800
- **Body (Paragraphs, Lists, Form content)**: Segoe UI 400/500/600

### Weight System
- **800**: Main headings (h1)
- **700**: Subheadings (h2, h3, labels, buttons)
- **600**: Bold body text, emphasis
- **500**: Medium body text, form fields
- **400**: Regular body text (default)

### Size Hierarchy
```
h1: 32px (Main page titles)
h2: 24px (Section titles)
h3: 20px (Card titles, modal headers)
h4: 16px (Form labels, emphasis text)
Body: 15px (Default, readable)
Small: 13px (Helper text, timestamps)
Tiny: 12px (Badges, captions)
```

### Line Height
- Headings: 1.2–1.4
- Body: 1.6
- Form fields: 1.5

---

## Text & Language Overhaul

### ❌ BEFORE → ✅ AFTER

#### Login/Register Pages
- ❌ "Username or Email" → ✅ "Your username or email"
- ❌ "Password" → ✅ "Secure password"
- ❌ "Registration failed. Please try again." → ✅ "Account creation failed. Check your details and try again."
- ❌ "tiffesnido@gbox.adnu.edu.ph" → ✅ "you@ateneo.edu.ph"

#### Lost Report Form
- ❌ "Item Name" → ✅ "What's missing?"
- ❌ "Item Description" → ✅ "Help us find it"
- ❌ "Date Lost" → ✅ "When did you lose it?"
- ❌ "Contact Information" → ✅ "How to reach you"
- ❌ "Finder Info" → ✅ "Who brought it in?"
- ❌ "Report a Lost Item" → ✅ "Report Missing Item"
- ❌ "Submit Report" → ✅ "File Report"

#### Found Items Form
- ❌ "Item Name" → ✅ "Item found"
- ❌ "Description" → ✅ "What do you know about it?"
- ❌ "Date Found" → ✅ "When did you find it?"
- ❌ "Register Found Item" → ✅ "Document Item"
- ❌ "Register Item" → ✅ "Save to Storage"

#### Matching Page
- ❌ "No matches found" → ✅ "🔍 No matches yet — the search continues"
- ❌ "Awaiting verification" → ✅ "Pending review by staff"
- ❌ "Error running matching" → ✅ "Couldn't run auto-match. Try again shortly."
- ❌ "Score" → ✅ "Confidence"

#### Empty States
- ❌ Generic message → ✅ Contextual message + emoji + action button
- Example:
  ```
  🎯 No lost reports yet
  Be the first to report a missing item
  [File a Report]
  ```

#### Search Page
- ❌ "Search failed. Please try again." → ✅ "Search didn't work — try simpler terms or different filters."
- ❌ "Results (0)" → ✅ "Nothing matched — expand your search?"

#### Claims Page
- ❌ "No claims found" → ✅ "📋 All clear — no pending claims"
- ❌ "Claim requests will appear here" → ✅ "Verified matches show up here for quick claiming"

#### General
- ❌ "Failed to submit" → ✅ "Couldn't save your data. Check your connection."
- ❌ "Loading..." → ✅ (just loading spinner, no text needed)
- ❌ "Pending" → ✅ "In progress"
- ❌ "Confirmed" → ✅ "Verified" or "Matched"

---

## Color Psychology & Usage

### Primary Colors
- **Navy (#16213D)**: Trust, authority, institutional
- **Gold (#D4A24E)**: Premium, warmth, Ateneo identity
- **Cream (#FBF3DC)**: Approachable, clean, calm

### Status Colors (Keep Consistent)
- **Green (#2F9E58)**: Success, confirmed, verified
- **Terracotta (#D2691E)**: Warning, pending, caution
- **Blue (#3B5FD9)**: Info, important details

### Usage Rules
- **Don't use**: 4+ colors in one view
- **Use gold**: For interactive elements only (buttons, links, focus states)
- **Use cream**: For backgrounds, not text
- **Use navy**: Authority, headers, high-contrast text

---

## UI Refinements

### Buttons
- Primary button: "File Report" not "Submit Report"
- Action buttons: Use verbs (Save, Report, Verify, Claim)
- Danger buttons: Use clear language ("Delete" not "Remove")
- Loading state: Show spinner + brief text ("Saving..." not "Loading...")

### Form Fields
- Labels above inputs (current: good)
- Placeholder text: Show example, not instruction
  - ❌ "Enter item name" → ✅ "e.g., Blue umbrella with brown handle"
- Help text: Provide context
  - Add: "Include any identifying marks or damage"
- Required indicator: Use asterisk but also label "(Required)"

### Cards & Lists
- Add hover elevation (lift effect) to interactive cards
- Show action on hover (View Details, Edit, etc.)
- Consistent spacing: 16px inside cards (current: 24px, consider 20px)

### Empty States
Pattern:
```
[Emoji] Large friendly headline
Supportive message
[Action Button]
```

Examples:
- Lost: 🔍 "Nothing lost yet? Knock on wood!"
- Found: 📦 "Empty safe — everything's claimed!"
- Claims: ✅ "All claimed! Great work, team!"

### Loading States
- Show skeleton screens instead of spinners for lists
- Show animated shimmer (current: good)
- Never show text "Loading..." alone

---

## Spacing System

### Recommended Tighter Spacing
- Container padding: 20px (current: 24px — good)
- Card padding: 20px (current: 24px)
- Gap between items: 12px (current: 16px)
- Label to input: 8px (current: match)

### Button Sizes
- Large: 48px height
- Default: 40px height
- Small: 32px height

---

## Dark Mode (Optional Future Feature)
If adding dark mode:
- Navy stays same
- Cream → Dark Navy (#0F1825)
- Gold → Lighter Gold (#E8C547)
- Text → Light gray (#E5E7EB)

---

## Microinteractions to Add

1. **Form Submit Success**
   - Toast: "✓ Saved successfully!"
   - Animation: Slide in from bottom, fade out

2. **Hover Effects**
   - Buttons: Slight brighten + shadow
   - Cards: Lift + shadow expansion
   - Links: Underline fade in

3. **Transitions**
   - Page load: Fade in (200ms)
   - Modal open: Slide + fade (300ms)
   - Button press: Quick scale (100ms)

4. **Feedback Consistency**
   - Error: Red banner with icon + message
   - Success: Green toast (auto-dismiss)
   - Loading: Spinner + context ("Verifying match...")

---

## Checklist for Full Implementation

- [ ] Add Inter font import (already done)
- [ ] Update all h1-h6 typography
- [ ] Replace generic text across all pages
- [ ] Update all empty state messages
- [ ] Standardize error messages (no "Failed to...")
- [ ] Add contextual help text to form fields
- [ ] Review button text for action verbs
- [ ] Test typography on mobile (Inter may render small)
- [ ] Update placeholder text (all form fields)
- [ ] Add emojis to empty states (2-3 max per page)

