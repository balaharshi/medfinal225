# Things to Do for Bala

**MedZiva Healthcare Website — Complete Pending Tasks**
**Date:** July 4, 2026
**Repository:** balaharshi/medfinal225 (main branch)
**Stack:** React (Vite) frontend + Laravel 12 backend, both on GoDaddy shared hosting

---

## HOW TO USE THIS DOCUMENT

Each section has:
- **What:** What needs to be done
- **Why:** Why it matters
- **Where:** Exact files and line numbers
- **How:** Step-by-step instructions
- **Verify:** How to confirm it works

You can use OpenCode to make these changes. Just tell it the file path and what to change.

---

## PART 1: CRITICAL — DO THESE FIRST (Before Anything Else)

---

### 1.1 Rotate All Exposed Credentials

**What:** The database password, Pusher keys, ENBDpay API key, and webhook secret are all visible in the git history. Anyone who has ever had access to the repo can see them.

**Why:** If someone has these values, they can access your database, send fake Pusher events, or intercept payments.

**How:**

1. **Database password:**
   - Go to GoDaddy → MySQL Databases
   - Change the password for the `medziva` database user
   - Update `med21-laravel/.env` with the new password:
     ```
     DB_PASSWORD=your_new_password_here
     ```

2. **Pusher keys:**
   - Go to https://dashboard.pusher.com → Your app → App Keys
   - Click "Regenerate" for Key and Secret
   - Update `med21-laravel/.env`:
     ```
     PUSHER_APP_ID=new_app_id
     PUSHER_KEY=new_key
     PUSHER_SECRET=new_secret
     ```

3. **ENBDpay API key:**
   - Contact ENBDpay to regenerate your API key and webhook secret
   - Update `med21-laravel/.env`:
     ```
     ENBDPAY_API_KEY=new_api_key
     ENBDPAY_WEBHOOK_SECRET=new_webhook_secret
     ```

4. **Laravel APP_KEY:**
   - On the server, run: `php artisan key:generate`
   - This will set a new `APP_KEY` in `.env`

**Verify:** Check that login, booking, and payment still work after changing credentials.

---

### 1.2 Deploy Latest Code to GoDaddy

**What:** All the code changes made today (security fixes, PusherService, booking endpoints, vendor profile changes, etc.) are on the `main` branch but not deployed.

**Why:** The live site is still running the old code.

**How:**

1. Pull latest code on your local machine:
   ```bash
   cd medfinal225
   git pull origin main
   ```

2. **Frontend (React):**
   ```bash
   cd med21
   npm install
   npm run build
   ```
   Upload the contents of `med21/dist/` to your GoDaddy public HTML directory (usually `public_html/` or `public_html/med21/`).

3. **Backend (Laravel):**
   Upload the contents of `med21-laravel/` to your GoDaddy hosting (e.g., `public_html/api/` or a subdirectory).

4. **On the server, run:**
   ```bash
   cd /path/to/med21-laravel
   composer install --no-dev --optimize-autoloader
   php artisan migrate --force
   php artisan config:cache
   php artisan route:cache
   ```

5. **Verify** the new Pusher package is installed:
   ```bash
   composer require pusher/pusher-php-server
   ```

**Verify:** Visit https://medzivahealthcare.com — the site should load. Visit https://medzivahealthcare.com/api/health — should return JSON.

---

### 1.3 Fix Laravel API Routing on GoDaddy

**What:** The API returns HTML instead of JSON (e.g., `/api/categories` returns an HTML page).

**Why:** The web server document root is not pointing to Laravel's `public/` directory.

**How:**

1. Make sure your Laravel installation's document root points to the `public/` folder, NOT the Laravel root.

2. If Laravel is in `public_html/api/`, then the document root should be `public_html/api/public/`.

3. Verify `.htaccess` exists in the `public/` directory with this content:
   ```apache
   <IfModule mod_rewrite.c>
       <IfModule mod_negotiation.c>
           Options -MultiViews -Indexes
       </IfModule>

       RewriteEngine On

       # Handle Front Controller...
       RewriteCond %{REQUEST_FILENAME} !-d
       RewriteCond %{REQUEST_FILENAME} !-f
       RewriteRule ^ index.php [L]
   </IfModule>
   ```

4. Make sure `mod_rewrite` is enabled in Apache. If not, contact GoDaddy support.

5. If you're on GoDaddy shared hosting, you may need to set the `RewriteBase` in `.htaccess`:
   ```apache
   RewriteBase /
   ```
   Or if Laravel is in a subdirectory:
   ```apache
   RewriteBase /api/
   ```

**Verify:** Visit `https://medzivahealthcare.com/api/categories` — should return JSON like `[{"id":"cat-...", "title":"..."}]`, NOT an HTML page.

---

### 1.4 Configure Google Sign-In

**What:** The `GOOGLE_CLIENT_ID` in `.env` is still the placeholder `YOUR_GOOGLE_CLIENT_ID_HERE`. Google login won't work until you set a real one.

**Why:** Users cannot sign in with Google.

**How:**

1. Go to https://console.cloud.google.com
2. Create a new project (or select existing)
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Authorized redirect URIs: Add these:
   - `https://medzivahealthcare.com/api/auth/google`
   - `https://medzivahealthcare.com/api/auth/google/callback`
   - `https://medzivahealthcare.com/api/auth/google/admin`
   - `https://medzivahealthcare.com/api/auth/google/vendor`
7. Copy the **Client ID**
8. Update `med21-laravel/.env`:
   ```
   GOOGLE_CLIENT_ID=your_real_client_id_here.apps.googleusercontent.com
   ```
9. Also update `med21/.env` (frontend):
   ```
   VITE_GOOGLE_CLIENT_ID=your_real_client_id_here.apps.googleusercontent.com
   ```

**Verify:** On the login page, the Google button should appear and allow you to sign in.

---

### 1.5 Set Admin Email Allowlist

**What:** Admin Google login only works if the email is in the `GOOGLE_ADMIN_EMAILS` list. Currently not set.

**Why:** Without this, no one can log in as admin via Google.

**How:**

1. Update `med21-laravel/.env`:
   ```
   GOOGLE_ADMIN_EMAILS=your_email@gmail.com,another_admin@gmail.com
   ```
   (Comma-separated, no spaces)

2. Make sure the admin user in the database has `role = 'super_admin'`. Check with:
   ```sql
   SELECT id, email, role FROM users WHERE role IN ('admin', 'super_admin');
   ```
   If the admin has `role = 'admin'` instead of `super_admin`, fix it:
   ```sql
   UPDATE users SET role = 'super_admin' WHERE email = 'your_admin_email@gmail.com';
   ```

**Verify:** Click "Sign in with Google" on the Admin login page. If your email is in the list, you should get admin access.

---

### 1.6 Configure Pusher for Real-Time Notifications

**What:** PusherService is now implemented (was a stub), but needs real Pusher credentials to work.

**Why:** Without this, no real-time notifications, no live booking updates, no enquiry auto-refresh.

**How:**

1. Go to https://dashboard.pusher.com
2. Create a new app (or use existing)
3. Go to **App Keys** — copy App ID, Key, Secret, Cluster
4. Update `med21-laravel/.env`:
   ```
   PUSHER_APP_ID=your_app_id
   PUSHER_KEY=your_key
   PUSHER_SECRET=your_secret
   PUSHER_CLUSTER=your_cluster
   PUSHER_USE_TLS=true
   PUSHER_CHANNEL=medziva-notifications
   ```
5. On the server, run:
   ```bash
   composer require pusher/pusher-php-server
   ```

**Verify:** Create a booking from the customer frontend. The admin panel should show it in real-time without page refresh.

---

## PART 2: CODE CHANGES — USE OPENCODE TO IMPLEMENT

---

### 2.1 Wire Admin Booking View to API

**What:** The admin "View" button on the bookings page uses pre-loaded client-side data. It should fetch fresh data from the API.

**Why:** If the booking list is stale, the View shows wrong data.

**Where:** `med21/src/components/AdminDashboard.tsx` around line 1481

**Current code:**
```typescript
const handleViewBooking = (booking: any) => {
  setViewingBooking(booking);
  setIsBookingViewModalOpen(true);
};
```

**Change to:**
```typescript
const handleViewBooking = async (booking: any) => {
  try {
    const res = await fetch(`/api/booking/${booking.id}`, getAdminRequestInit());
    if (res.ok) {
      const freshBooking = await res.json();
      setViewingBooking(freshBooking);
    } else {
      setViewingBooking(booking);
    }
  } catch {
    setViewingBooking(booking);
  }
  setIsBookingViewModalOpen(true);
};
```

**How to do it in OpenCode:**
> "In med21/src/components/AdminDashboard.tsx, find the handleViewBooking function around line 1481 and replace it with a version that fetches fresh data from /api/booking/{id} before opening the modal."

---

### 2.2 Add Vendor Logo Field to Admin Vendor Form

**What:** The vendor create/edit form in AdminDashboard needs a "Logo URL" field.

**Why:** The `logo` column was added to the database but there's no way to set it from the admin panel.

**Where:** `med21/src/components/AdminDashboard.tsx` — search for the vendor create/edit form (around line 2698-2772)

**What to add:** Inside the vendor form, add a new input field after the existing fields:

```tsx
<div className="space-y-1.5">
  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
    Logo URL (optional)
  </label>
  <input
    type="url"
    value={vendorForm.logo || ""}
    onChange={e => setVendorForm({ ...vendorForm, logo: e.target.value })}
    placeholder="https://example.com/logo.png"
    className="w-full text-xs px-4 py-3 border border-slate-200 rounded-xl focus:border-medical-green focus:outline-none"
  />
</div>
```

Also make sure `logo` is included in the vendor form state and in the API payload.

**How to do it in OpenCode:**
> "In med21/src/components/AdminDashboard.tsx, find the vendor create/edit form and add a Logo URL input field. Also make sure the logo field is included in the form state and sent to the API when creating or updating a vendor."

---

### 2.3 Add Profile Change Request Review in Admin

**What:** The admin needs a section to view and approve/reject vendor profile change requests.

**Why:** Vendors can now submit profile change requests, but there's no admin UI to manage them.

**Where:** `med21/src/components/AdminDashboard.tsx`

**What to add:** In the admin dashboard, add a new section (could be under "Vendor Partners" or as a separate tab) that:

1. Fetches requests from `GET /api/vendorProfileChangeRequests`
2. Displays them in a table with: Vendor Name, Field, Current Value, Requested Value, Reason, Status
3. Has Approve/Reject buttons that call `PATCH /api/vendorProfileChangeRequests/{id}/review`

**Example implementation:**
```tsx
// Add state
const [profileChangeRequests, setProfileChangeRequests] = useState<any[]>([]);

// Add fetch function
const fetchProfileChangeRequests = async () => {
  const res = await fetch('/api/vendorProfileChangeRequests', getAdminRequestInit());
  if (res.ok) {
    const data = await res.json();
    setProfileChangeRequests(data);
  }
};

// Add review handler
const handleReviewProfileChangeRequest = async (id: string, status: 'approved' | 'rejected') => {
  const res = await fetch(`/api/vendorProfileChangeRequests/${id}/review`, getAdminRequestInit({
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }));
  if (res.ok) {
    toast.success(`Request ${status}`);
    fetchProfileChangeRequests();
  }
};
```

**How to do it in OpenCode:**
> "In med21/src/components/AdminDashboard.tsx, add a new section for reviewing vendor profile change requests. Add state for the requests, a fetch function to load them from GET /api/vendorProfileChangeRequests, and approve/reject buttons that call PATCH /api/vendorProfileChangeRequests/{id}/review. Display it as a table with columns: Vendor, Field, Current, Requested, Reason, Status, Actions."

---

### 2.4 Fix Super Admin Count

**What:** The Super Admin count shows as zero on the Users page.

**Why:** The admin user might have `role = 'admin'` instead of `role = 'super_admin'` in the database.

**How:**

1. On the server, check the database:
   ```sql
   SELECT id, email, role FROM users;
   ```

2. If the admin user has `role = 'admin'`, update it:
   ```sql
   UPDATE users SET role = 'super_admin' WHERE email = 'your_email@gmail.com';
   ```

3. The count logic in the code is correct — it dynamically computes from the database. This is a data issue, not a code issue.

**Verify:** After updating the role, refresh the Admin Panel Users page. Super Admin count should show 1 (or however many super admins exist).

---

### 2.5 Admin Dashboard Cleanup

**What:** Remove unnecessary cards, widgets, duplicate information, and improve layout.

**Why:** The dashboard is cluttered and hard to read.

**Where:** `med21/src/components/AdminDashboard.tsx`

**What to do:**

1. **Remove** any cards that show static/dummy data
2. **Keep only:** Total Bookings, Pending, Confirmed, Completed, Cancelled, Active Vendors, Total Customers, New Enquiries, Recent Activity
3. **Fix spacing** — reduce unnecessary empty spaces between sections
4. **Make responsive** — ensure the grid works on mobile (use `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` pattern)
5. **Remove** any duplicate cards that show the same information twice

**How to do it in OpenCode:**
> "In med21/src/components/AdminDashboard.tsx, clean up the dashboard overview section. Remove any unnecessary or duplicate cards. Keep only: Total Bookings, Pending Bookings, Confirmed Bookings, Completed Bookings, Cancelled Bookings, Active Vendors, Total Customers, New Enquiries, Recent Activity. Improve spacing and responsiveness."

---

### 2.6 Vendor Panel Cleanup

**What:** Simplify the vendor panel, remove static data, improve mobile.

**Why:** The vendor panel is cluttered and not mobile-friendly.

**Where:** `med21/src/components/VendorDashboard.tsx`

**What to do:**

1. **Remove** any hardcoded/static data (like dummy booking counts)
2. **Simplify navigation** — use clear, simple tab labels
3. **Improve mobile** — make sure all tables scroll horizontally on small screens
4. **Fix loading states** — show a spinner while data loads
5. **Fix empty states** — show "No bookings yet" instead of blank space when there are no bookings

**How to do it in OpenCode:**
> "In med21/src/components/VendorDashboard.tsx, clean up the dashboard. Remove static/dummy data. Improve mobile responsiveness by adding overflow-x-auto to tables. Add proper loading spinners and empty state messages."

---

## PART 3: DEPLOYMENT CHECKLIST

After all changes are made:

1. **Pull latest code:**
   ```bash
   cd medfinal225
   git pull origin main
   ```

2. **Build frontend:**
   ```bash
   cd med21
   npm install
   npm run build
   ```

3. **Upload frontend** (med21/dist/) to GoDaddy

4. **Upload backend** (med21-laravel/) to GoDaddy

5. **On the server:**
   ```bash
   cd /path/to/med21-laravel
   composer install --no-dev --optimize-autoloader
   composer require pusher/pusher-php-server
   php artisan migrate --force
   php artisan config:cache
   php artisan route:cache
   ```

6. **Update .env** with all real credentials (see Part 1)

7. **Test everything:**
   - [ ] Homepage loads
   - [ ] Services display with correct images
   - [ ] Customer can register and login
   - [ ] Google login works
   - [ ] Admin can login
   - [ ] Admin can view bookings
   - [ ] Admin can manage vendors
   - [ ] Vendor can login
   - [ ] Vendor can see bookings
   - [ ] Vendor can accept bookings
   - [ ] Booking creates in real-time
   - [ ] Enquiry creates in real-time
   - [ ] Vendor profile is read-only
   - [ ] Vendor can submit change requests
   - [ ] Admin can review change requests

---

## PART 4: QUICK REFERENCE — ENV VARIABLES

File: `med21-laravel/.env`

```env
# APP
APP_NAME=MedZiva
APP_ENV=production
APP_KEY=                    # php artisan key:generate
APP_DEBUG=false
APP_URL=https://medzivahealthcare.com
FRONTEND_URL=https://medzivahealthcare.com

# DATABASE
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=medziva
DB_USERNAME=medziva
DB_PASSWORD=                # ROTATE — was exposed

# GOOGLE
GOOGLE_CLIENT_ID=           # From Google Cloud Console
GOOGLE_ADMIN_EMAILS=        # Comma-separated admin emails

# PUSHER (real-time)
PUSHER_APP_ID=              # ROTATE
PUSHER_KEY=                 # ROTATE
PUSHER_SECRET=              # ROTATE
PUSHER_CLUSTER=             # e.g., ap2
PUSHER_USE_TLS=true
PUSHER_CHANNEL=medziva-notifications

# PAYMENT
ENBDPAY_API_KEY=            # ROTATE
ENBDPAY_WEBHOOK_SECRET=     # ROTATE
ENBDPAY_MOCK=true           # Set to false when ready for real payments

# SESSION
SESSION_DRIVER=database
SANCTUM_STATEFUL_DOMAINS=medzivahealthcare.com,localhost,localhost:5173
```

File: `med21/.env` (frontend)

```env
VITE_GOOGLE_CLIENT_ID=      # Same as backend GOOGLE_CLIENT_ID
```

---

## PART 5: COMMON ISSUES & FIXES

| Problem | Fix |
|---|---|
| API returns HTML instead of JSON | Fix document root to point to `public/` directory |
| Google login button doesn't appear | Set real `VITE_GOOGLE_CLIENT_ID` in frontend `.env` |
| Google login fails | Set real `GOOGLE_CLIENT_ID` in backend `.env` + add email to `GOOGLE_ADMIN_EMAILS` |
| Pusher notifications not working | Set real Pusher credentials + run `composer require pusher/pusher-php-server` |
| "SQLSTATE" database error | Run `php artisan migrate --force` |
| White screen after deploy | Check `APP_DEBUG=false` and look at `storage/logs/laravel.log` |
| Vendor can edit profile | Code was changed to make it read-only — redeploy latest code |
| Speech Therapy image same as Physio | Already fixed — redeploy latest code |
| 403 on admin routes | Email not in `GOOGLE_ADMIN_EMAILS` or user role is not `super_admin` |

---

*Generated by MedZiva AI Assistant — July 4, 2026*
