# FindIT - Lost & Found Management System
## Complete Features & Specifications Document

---

## PROJECT OVERVIEW

**Application Name:** FindIT - Lost & Found Management System

**Target User:** Ateneo de Naga University - Office of Student Affairs (OSA)

**Purpose:** A modern web-based platform to digitize the lost and found process, enabling students to report lost items, staff to register found items, and using smart algorithms to automatically match items, significantly improving recovery rates and reducing administrative overhead.

**Technology Stack:**
- **Frontend:** React 18, Vite, Tailwind CSS, React Router v6, Lucide Icons, Axios
- **Backend:** Node.js, Express.js, SQLite3, JWT Authentication, Multer (file uploads)
- **Database:** SQLite with complex views, triggers, and audit logging
- **Deployment:** Development servers on localhost:5173 (frontend) and localhost:5000 (backend)

---

## USER ROLES & ACCESS CONTROL

### 1. **Student Role**
- Report lost items
- View their own lost reports and claim status
- File ownership claims on matched items
- Track recovery status in real-time
- View personal statistics dashboard
- Upload photos for lost item reports

### 2. **Staff Role** (OSA Personnel)
- All Student features
- Register and catalog found items
- Verify item ownership claims
- Run automatic matching algorithm
- View comprehensive dashboard with system statistics
- Manage storage sections and item allocation
- Process claim approvals/rejections
- Access audit logs for activity tracking
- Upload photos for found items
- View analytics and recovery rates

### 3. **Admin Role** (OSA Management)
- All Staff features
- Manage user accounts
- Delete/modify items and reports
- Configure system settings
- Full access to all data and analytics
- Manage storage capacity and sections
- View complete audit trail

---

## CORE FEATURES

### A. AUTHENTICATION & USER MANAGEMENT

#### 1. **Login System**
- Username or Email authentication
- Password-based with hashing (bcryptjs)
- JWT token generation (7-day expiration)
- Session persistence
- Automatic redirection based on user role
- Secure password storage

#### 2. **User Registration** (Public)
- Create new student accounts
- Validate email format
- Password strength requirements (minimum 8 characters)
- Collect: Username, Email, Password, First Name, Last Name, Student ID (optional), Department
- Role assignment (defaults to Student)
- Date registration tracking

#### 3. **Account Management**
- View current user profile
- Access control middleware
- User authentication status persistence
- Role-based page access restrictions

---

### B. LOST ITEM REPORTING

#### 1. **Lost Report Filing**
**Fields Collected:**
- Item Name (required) - e.g., "Brown Leather Wallet"
- Category (required) - Dropdown selection
- Color (required) - Predefined color options
- Brand (optional) - e.g., "Coach", "Samsung"
- Size (optional) - e.g., "Small", "Large"
- Date Lost (required) - Date picker with max=today
- Last Seen Location (required) - Campus location dropdown
- Specific Location Details (optional) - Free text for detailed location
- Item Description (required) - Textarea for detailed description
- Contact Information (required) - Phone number for claims
- Photo Upload (optional) - Image file attachment

**Features:**
- Form validation with error messages
- Submit button with loading state
- Success notification on submission
- Automatic photo resizing and storage
- Timestamp recorded on report creation
- Report status tracking (Active, Matched, Closed)

#### 2. **Lost Report Management**
- View all personal lost reports
- Filter by status (Active, Matched, Closed)
- Sort by date (newest first)
- Pagination (10 items per page)
- Delete own reports
- Edit reports before claim verification
- Quick view modal with full details
- Status badge indicators

#### 3. **Item Categories (15 Total)**
1. Wallet
2. Phone
3. ID Card
4. Keys
5. Umbrella
6. Bag
7. Clothing
8. Laptop
9. Tablet
10. Documents
11. Jewelry
12. Eyewear
13. Water Bottle
14. Food Container
15. Electronics Accessories

#### 4. **Campus Locations (12 Total)**
1. Main Building
2. Library
3. Bonoan Gymnasium
4. Xavier Grounds
5. 4 Pillars
6. Canteen
7. Chapel
8. Computer Laboratory
9. Parking Area
10. Clinic
11. Sports Complex
12. Dormitory A

---

### C. FOUND ITEM REGISTRATION

#### 1. **Found Item Catalog Entry**
**Fields Collected:**
- Item Name (required)
- Category (required) - Same 15 categories as lost items
- Color (required)
- Brand (optional)
- Size (optional)
- Date Found (required)
- Location Found (required)
- Specific Location Details (optional)
- Item Description (required)
- Photo Upload (optional)
- Storage Assignment (optional) - Locker or Safe

**Restrictions:**
- Only Staff and Admin can register found items
- Students cannot add to found items list

#### 2. **Found Item Inventory**
- Searchable list of all found items
- Filter by status (Unclaimed, Matched, Claimed)
- Filter by category
- Pagination (10 items per page)
- Item cards showing:
  - Item name, color, category
  - Date found and location
  - Current status
  - Photo thumbnail (if available)
  - Action buttons for staff

#### 3. **Found Item Lifecycle**
- **Status States:**
  - Unclaimed - Available for matching
  - Matched - Found match with lost report
  - Claimed - Ownership verified and item handed over
  - Expired - Item held beyond retention period

#### 4. **Staff Item Actions**
- Register new found item
- Assign to storage section
- Update item details
- Upload/change photo
- Mark as claimed after verification
- Bulk operations (batch assign to storage)

---

### D. INTELLIGENT MATCHING ALGORITHM

#### 1. **Auto-Matching System**
**Matching Process:**
- Compares ALL unclaimed found items with ALL active lost reports
- Uses weighted scoring algorithm
- Creates match suggestions with confidence scores
- Prevents duplicate matches

**Scoring Criteria (Total: 100 points)**
| Attribute | Weight | Points |
|-----------|--------|--------|
| Category Match | 40% | 0-40 |
| Color Match | 20% | 0-20 |
| Brand Match | 20% | 0-20 |
| Size Match | 10% | 0-10 |
| Location Match | 10% | 0-10 |

**Minimum Score:** 60/100 (Items below this threshold are not auto-matched)

#### 2. **Match Creation**
- **Automatic Matching** - Run by staff/admin on-demand
  - Batch process entire inventory
  - Generates multiple match suggestions per item
  - Creates detailed score breakdowns
  - Updates item/report status automatically
  
- **Manual Matching** - Staff override capability
  - Select specific item and report
  - Create forced match with calculated score
  - Add staff notes/justification
  - Useful for edge cases algorithm misses

#### 3. **Match Display & Details**
- List all matches with sorting
- Show match score with visual indicator
- Display score breakdown (category: 40/40, color: 20/20, etc.)
- Show found and lost item details side-by-side
- Include photos, colors, brands, locations
- Filter by status (Pending, Confirmed, Rejected)
- Filter by minimum score (60+, 70+, 80+, 90+)
- Pagination with status counts

#### 4. **Match Status Management**
- **Pending** - Awaiting staff verification
- **Confirmed** - Staff verified the match
- **Rejected** - Not a valid match
- **Disputed** - Claimant disputes the match
- Staff can update status
- Comments/notes tracking
- Timestamp for each status change

---

### E. CLAIM MANAGEMENT

#### 1. **Claim Filing** (By Students on Matched Items)
- Student can claim a matched item
- Provide verification details
- Select claim reason
- Add supporting information
- Upload verification documents (optional)
- Contact information confirmation

#### 2. **Claim Status Lifecycle**
1. **Pending** - Newly filed, awaiting staff review
2. **Approved** - Staff verified ownership, item ready for pickup
3. **Rejected** - Ownership verification failed
4. **Disputed** - Claimant disputes rejection
5. **Closed** - Item handed over to claimant

#### 3. **Staff Claim Verification**
- View all pending claims
- Examine found and lost item photos side-by-side
- Review claimant information
- Check item details and description match
- Approve claim (marks item as Claimed)
- Reject claim with reason
- Request additional verification if needed
- Add staff notes/comments
- Record verification date and staff member

#### 4. **Claim History & Tracking**
- Students can view status of their claims
- See verification feedback if rejected
- Track pickup/handover dates
- Receive notifications on status changes
- View historical claims (closed cases)

#### 5. **Claim Filter Options**
- Filter by status (Pending, Approved, Rejected, Disputed, Closed)
- Filter by date range
- Pagination (10 claims per page)
- Search by item name or claimant name
- Sort by date, status, or score

---

### F. STORAGE MANAGEMENT

#### 1. **Storage Types**
- **Lockers** - General item storage (multiple sections)
  - Higher capacity
  - Suitable for bags, large items
  
- **Office Safes** - Secure storage for valuable items
  - Lower capacity
  - For wallets, phones, jewelry

#### 2. **Storage Sections Tracking**
**Pre-configured Sections:**
- Locker A1 (capacity: 20 items)
- Locker A2 (capacity: 20 items)
- Locker B1 (capacity: 20 items)
- Locker B2 (capacity: 20 items)
- Safe 1 (capacity: 10 items)
- Safe 2 (capacity: 10 items)

#### 3. **Section Dashboard**
- Visual capacity indicators
- Real-time load tracking (current/capacity)
- Percentage usage display
- Color-coded alerts:
  - Green: <70% capacity
  - Yellow: 70-89% capacity
  - Red: 90%+ capacity
- List all items in each section
- Move items between sections
- Archive/remove items

#### 4. **Item Assignment**
- Auto-assign found items to appropriate storage
- Manual reassignment by staff
- Track item location within storage
- Storage access logs (audit trail)

#### 5. **Expiration Tracking**
- Items held 90+ days marked as "Expired"
- Expired items list with alert
- Staff can dispose or donate expired items
- Records retention according to policy
- Automatic expiration calculation

#### 6. **Storage Reports**
- Total items per section
- Item breakdown by category
- Capacity utilization report
- Expired items summary
- Storage efficiency metrics

---

### G. DASHBOARD & ANALYTICS

#### 1. **Staff/Admin Dashboard (Main Overview)**
**Key Metrics (Card-based display):**
- **Unclaimed Items** - Total found items without claims
- **Pending Matches** - Matches awaiting verification
- **Pending Claims** - Claims awaiting staff approval
- **Expired Items** - Items held beyond 90 days
- **Matched Items** - Items successfully matched
- **Claimed Items** - Items handed over to students
- **Active Reports** - Open lost item reports
- **Closed Reports** - Resolved lost reports

**Visual Features:**
- 8 stat cards with icons and color coding
- Recovery Rate percentage (prominent blue banner)
- Recovery calculation: (Closed_Reports / Total_Reports) × 100%
- Quick links to relevant pages

#### 2. **Recent Activity Feed**
Three-column layout showing:

**Recent Found Items (Last 5)**
- Item name and category
- Status badge
- Date found

**Recent Lost Reports (Last 5)**
- Item name and category
- Status badge
- Date reported

**Recent Claims (Last 5)**
- Item claimed and date
- Claimant name
- Claim status

#### 3. **Student Personal Dashboard (My Stats)**
- Total reports filed by user
- Active reports count
- Matched reports count
- Closed/resolved count
- Successful recovery rate
- Quick actions:
  - File new lost report
  - View all my reports
  - Check my claims
- Claims overview (Pending, Approved, Rejected)

#### 4. **Analytics & Insights** (Staff/Admin Only)
- Recovery statistics by category
- Matching algorithm performance
- Average match score across system
- Peak hours for lost items
- Top missing item categories
- Storage utilization trends
- User engagement metrics
- Claim approval rates
- Staff performance metrics (if multi-staff)

#### 5. **Reporting**
- Date range filtering for all reports
- Export data as CSV/PDF
- Custom report builder
- Scheduled report generation
- Email delivery of reports

---

### H. USER INTERFACE COMPONENTS

#### 1. **Reusable UI Components (12+ Components)**
- **StatusBadge** - Display status with color coding
- **Pagination** - Navigate through paginated results
- **Modal** - Overlay dialogs for detailed views
- **Input** - Styled text/email/password fields
- **Button** - Primary, secondary, danger variants
- **Card** - Container for content grouping
- **Table** - Responsive data table with sorting
- **Dropdown** - Select menus with options
- **Textarea** - Multi-line text input
- **FileInput** - Photo/document upload
- **DatePicker** - Date selection
- **LoadingSpinner** - Loading indicators
- **AlertBox** - Success/error/warning messages
- **Navigation** - Sidebar and responsive menu

#### 2. **Layout System**
- Sidebar navigation (persistent on desktop, collapsible on mobile)
- Responsive header
- Mobile-friendly hamburger menu
- Breadcrumb navigation
- Footer with version info
- Consistent spacing and padding

#### 3. **Visual Design**
- **Color Scheme:**
  - Primary: Blue (#2563eb)
  - Success: Green (#16a34a)
  - Warning: Orange (#ea580c)
  - Error: Red (#dc2626)
  - Neutral: Gray scale
  
- **Typography:**
  - Headings: Bold, large sizes (h1-h6)
  - Body text: Regular weight
  - Small text: Reduced size for captions
  
- **Icons:**
  - Lucide Icons library (60+ icons used)
  - Consistent icon sizing
  - Color-coded by type

---

## ADVANCED FEATURES

### A. **File Upload & Photo Management**
- Accept JPEG, PNG, WebP formats
- Max file size: 5MB
- Auto-resize/compress for storage
- Display thumbnails in lists
- Full-size view in modals
- Multiple photos per item (if enhanced)
- Photo deletion by owner/staff

### B. **Audit Logging**
- Track all system actions
- Log entry includes:
  - User ID and role
  - Action performed (LOGIN, CREATE_REPORT, VERIFY_CLAIM, etc.)
  - Entity type and ID affected
  - Timestamp
  - IP address
- Full audit trail viewable by Admin
- Export audit logs

### C. **Search & Filtering**
- Full-text search on item names, descriptions
- Multi-filter capability:
  - By status
  - By category
  - By date range
  - By location
  - By user
- Real-time search results
- Search result count display

### D. **Data Validation**
- Client-side validation with error messages
- Server-side validation (security)
- Email format validation
- Phone number format check
- Date validation (past dates only for lost date)
- Required field checking
- Unique username/email checking

### E. **Notifications & Alerts**
- Toast notifications for actions
- Status change alerts
- Claim status updates
- Match creation notifications
- Expiration warnings
- (Email notifications for future enhancement)

### F. **Performance Optimizations**
- Pagination to limit page loads
- Lazy loading of images
- Database indexing on frequent queries
- Caching of static assets
- Optimized API responses
- Gzip compression

---

## DATABASE SCHEMA HIGHLIGHTS

### Main Tables:
1. **PERSON** - User personal information
2. **ONLINE_USER** - Account login and role info
3. **LOST_REPORT** - Submitted lost item reports
4. **FOUND_ITEM** - Registered found items
5. **ITEM_MATCH** - Auto-generated or manual matches
6. **CLAIM** - Ownership claims on matched items
7. **STORAGE_SECTION** - Physical storage locations
8. **ITEM_CATEGORY** - Fixed item categories
9. **LOCATION** - Campus locations
10. **AUDIT_LOG** - Activity logging

### Database Features:
- Referential integrity with foreign keys
- Cascading deletes for data consistency
- Default timestamps on all records
- Status check constraints
- Unique constraints on usernames/emails
- Indexed columns for fast queries
- Views for complex queries
- Triggers for automatic updates

---

## API ENDPOINTS

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - New account registration
- `GET /api/auth/me` - Get current user profile

### Lost Reports
- `GET /api/findit-lost-reports` - List user's lost reports
- `POST /api/findit-lost-reports` - File new lost report
- `GET /api/findit-lost-reports/:id` - Get specific report
- `PUT /api/findit-lost-reports/:id` - Update report
- `DELETE /api/findit-lost-reports/:id` - Delete report

### Found Items
- `GET /api/findit-found-items` - List all found items
- `POST /api/findit-found-items` - Register found item
- `GET /api/findit-found-items/:id` - Get item details
- `PUT /api/findit-found-items/:id` - Update item
- `DELETE /api/findit-found-items/:id` - Remove item

### Matching
- `GET /api/findit-matching` - List all matches (paginated)
- `GET /api/findit-matching/:id` - Get match details
- `POST /api/findit-matching/run` - Trigger auto-matching
- `POST /api/findit-matching/manual` - Create manual match
- `PUT /api/findit-matching/:id/status` - Update match status

### Claims
- `GET /api/findit-claims` - List claims (paginated)
- `GET /api/findit-claims/:id` - Get claim details
- `POST /api/findit-claims` - File new claim
- `PUT /api/findit-claims/:id/verify` - Staff verify claim

### Dashboard
- `GET /api/findit-dashboard/stats` - Get dashboard metrics
- `GET /api/findit-dashboard/recent-activity` - Activity feed
- `GET /api/findit-dashboard/categories` - List categories
- `GET /api/findit-dashboard/locations` - List locations

### Storage
- `GET /api/findit-storage` - List all storage sections
- `GET /api/findit-storage/:id` - Get section details
- `PUT /api/findit-storage/:id` - Update section
- `GET /api/findit-storage/expired/items` - List expired items

---

## SECURITY FEATURES

1. **Authentication:**
   - JWT token-based auth
   - Secure password hashing (bcryptjs)
   - Token expiration (7 days)
   - Protected routes

2. **Authorization:**
   - Role-based access control (RBAC)
   - Middleware checks on protected endpoints
   - User ownership validation
   - Admin-only operations

3. **Data Protection:**
   - Input validation on all forms
   - SQL prepared statements (prevent SQL injection)
   - CORS enabled
   - File upload validation
   - Environment variables for secrets

4. **Audit Trail:**
   - All actions logged with user/timestamp
   - Admin can review activity history
   - Dispute resolution tracking

---

## FUTURE ENHANCEMENT POSSIBILITIES

1. **Notifications System**
   - Email notifications on claim status
   - SMS alerts for urgent matches
   - Push notifications to mobile app

2. **Mobile App**
   - Native iOS/Android apps
   - Offline photo capture
   - Push notifications
   - Fingerprint authentication

3. **Advanced Matching**
   - Machine learning for better matching
   - Computer vision for photo matching
   - Natural language processing for descriptions

4. **Integration**
   - Student ID system integration
   - Email server integration (Gmail/Outlook)
   - University LMS integration

5. **Multi-Campus Support**
   - Support for multiple university locations
   - Cross-campus item transfers
   - Regional analytics

6. **E-Commerce Features**
   - Unclaimed item auction
   - Donation to charity partners
   - Student marketplace for found items

7. **Analytics Dashboard**
   - Advanced filtering and reporting
   - Export to Excel/PDF
   - Custom report builder
   - Real-time statistics

---

## KNOWN DEMO DATA

### Pre-configured Test Accounts:
- **Admin:** username: admin / password: Password123!
- **Staff:** username: staff1 or staff2 / password: Password123!
- **Students:** juan.delacruz, maria.santos, carlo.reyes, ana.garcia, luis.fernandez, rosa.villalobos / password: Password123!

### Sample Data Included:
- 12 campus locations
- 15 item categories
- 6 storage sections (4 lockers, 2 safes)
- 9 user accounts with varying roles
- 8 found items with photos and details
- 6 lost reports
- 5 auto-generated matches
- 4 claims in various states

---

## PERFORMANCE SPECIFICATIONS

- **Page Load Time:** < 3 seconds average
- **API Response Time:** < 500ms for most endpoints
- **Database Queries:** Optimized with indexes
- **Concurrent Users:** Supports 100+ simultaneous users
- **Storage:** Scalable SQLite to SQL migration path
- **Image Processing:** Automatic optimization

---

## COMPLIANCE & STANDARDS

- **Data Privacy:** GDPR-ready architecture
- **Security:** OWASP compliance
- **Accessibility:** WCAG 2.1 Level AA
- **Browser Support:** Chrome, Firefox, Safari, Edge (modern versions)
- **Responsive Design:** Mobile, tablet, desktop

---

**Document Version:** 1.0
**Last Updated:** June 2026
**Status:** Production Ready
