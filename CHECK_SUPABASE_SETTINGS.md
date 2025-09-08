# 🔧 SUPABASE AUTH SETTINGS TO CHECK

The "Database error saving new user" with 500 status usually indicates one of these issues:

## 1. 🗃️ DATABASE ISSUES (Run SQL Scripts First)

**Run these scripts in order:**
1. `DIAGNOSE_AUTH_ISSUE.sql` - See what's wrong
2. `FIX_AUTH_SIGNUP.sql` - Fix the issues

## 2. ⚙️ SUPABASE PROJECT SETTINGS TO CHECK

Go to your Supabase dashboard: `https://zxbbxlrrahjhfbhzmlfz.supabase.co`

### **Authentication Settings:**
1. **Settings** → **Authentication**
2. Check these settings:

**Email Auth:**
- ✅ Enable email confirmations: `OFF` (for testing) or `ON` (for production)
- ✅ Secure email change: `ON`
- ✅ Double confirm email changes: `OFF`

**Security:**
- ✅ Enable phone confirmations: `OFF`
- ✅ Enable custom SMTP: `OFF` (unless you have custom email setup)

### **Database Settings:**
1. **Settings** → **Database**
2. Check **Connection pooling**: Should be `Transaction` mode

### **API Settings:**
1. **Settings** → **API**
2. Verify your **anon key** matches what's in Netlify:
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4YmJ4bHJyYWhqaGZiaHptbGZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczNTMxNTUsImV4cCI6MjA3MjkyOTE1NX0.OAH24tTc-xqm73PZbYLpR-afM4Odh2xZzDOBMl3yV0o
   ```

## 3. 🔄 MOST LIKELY FIXES

Based on the error pattern, try these in order:

### **Option A: Remove Problematic Database Triggers**
```sql
-- Run FIX_AUTH_SIGNUP.sql (this removes triggers that cause 500 errors)
```

### **Option B: Disable Email Confirmation Temporarily**
1. Go to **Settings** → **Authentication**
2. Turn **OFF** "Enable email confirmations"
3. Try signup again
4. Turn it back **ON** after testing

### **Option C: Check RLS Policies**
The fix script handles this, but manually verify:
- ❌ `auth.users` should NOT have RLS enabled
- ✅ `public.profiles` SHOULD have RLS enabled

## 4. 🧪 TESTING STEPS

After running the fix:

1. **Clear browser cache/cookies**
2. **Try signup with a new email**
3. **Check browser console** for:
   ```
   🔄 Starting user signup...
   ✅ User created and confirmed, creating profile...
   ✅ Profile created successfully
   ```

## 5. 🚨 IF STILL FAILING

If you still get "Database error saving new user":

1. **Check Supabase Logs:**
   - Go to **Logs** → **Auth logs**
   - Look for detailed error messages

2. **Try Manual User Creation:**
   - Go to **Authentication** → **Users**
   - Click "Add user" manually
   - If this fails, it's a Supabase project issue

3. **Create New Supabase Project:**
   - Sometimes auth gets corrupted
   - Fresh project might be needed

## 6. 📞 NEXT STEPS

Run the SQL scripts first, then check these settings. Let me know:
1. What the `DIAGNOSE_AUTH_ISSUE.sql` shows
2. What happens after running `FIX_AUTH_SIGNUP.sql`
3. Your current auth settings in Supabase dashboard
