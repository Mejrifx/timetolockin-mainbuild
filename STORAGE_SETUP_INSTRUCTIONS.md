# Supabase Storage Setup Instructions

## Method 1: SQL Script (Recommended)
Run the `CREATE_STORAGE_BUCKET.sql` script in your Supabase SQL Editor.

## Method 2: Supabase Dashboard (Alternative)
If the SQL script doesn't work, follow these steps:

### Step 1: Go to Storage
1. Open your Supabase project dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **"New bucket"**

### Step 2: Create Bucket
- **Name**: `gm-media`
- **Public bucket**: ✅ **Check this box** (important!)
- **File size limit**: `50 MB`
- **Allowed MIME types**: 
  - `image/jpeg`
  - `image/png` 
  - `image/gif`
  - `image/webp`
  - `image/svg+xml`
  - `video/mp4`
  - `video/webm`
  - `video/quicktime`
  - `video/x-msvideo`

### Step 3: Set Permissions
After creating the bucket, you need to set up Row Level Security (RLS) policies:

1. Go to **Storage** → **Policies**
2. Click **"New Policy"** for the `gm-media` bucket
3. Create these policies:

#### Policy 1: Upload Files
- **Policy name**: "Authenticated users can upload files"
- **Operation**: INSERT
- **Target roles**: authenticated
- **Policy definition**:
```sql
bucket_id = 'gm-media' 
AND auth.role() = 'authenticated'
AND auth.uid()::text = (storage.foldername(name))[1]
```

#### Policy 2: View Files
- **Policy name**: "Users can view own files"
- **Operation**: SELECT
- **Target roles**: authenticated
- **Policy definition**:
```sql
bucket_id = 'gm-media' 
AND auth.role() = 'authenticated'
AND auth.uid()::text = (storage.foldername(name))[1]
```

#### Policy 3: Update Files
- **Policy name**: "Users can update own files"
- **Operation**: UPDATE
- **Target roles**: authenticated
- **Policy definition**:
```sql
bucket_id = 'gm-media' 
AND auth.role() = 'authenticated'
AND auth.uid()::text = (storage.foldername(name))[1]
```

#### Policy 4: Delete Files
- **Policy name**: "Users can delete own files"
- **Operation**: DELETE
- **Target roles**: authenticated
- **Policy definition**:
```sql
bucket_id = 'gm-media' 
AND auth.role() = 'authenticated'
AND auth.uid()::text = (storage.foldername(name))[1]
```

## Verification
After setup, test by:
1. Creating an image or video block
2. Uploading a file
3. Check the console for success messages
4. The file should appear in the block

## Troubleshooting
- **"Bucket not found"**: Bucket wasn't created or has wrong name
- **"Permission denied"**: RLS policies not set up correctly
- **"File too large"**: Increase file size limit in bucket settings
- **"Invalid MIME type"**: Add the file type to allowed MIME types
