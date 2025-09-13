import { supabase } from '@/lib/supabase'

export interface UploadedMedia {
  url: string
  path: string
  mimeType: string
}

const BUCKET_ID = 'gm-media'

export async function uploadFileToStorage(file: File): Promise<UploadedMedia> {
  console.log('🔄 Starting file upload to storage:', file.name, 'Size:', file.size, 'Type:', file.type);
  
  const { data: userData, error: authError } = await supabase.auth.getUser()
  if (authError || !userData.user) {
    console.error('❌ Authentication error:', authError);
    throw new Error('Not authenticated')
  }

  const userId = userData.user.id
  const timestamp = Date.now()
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `${userId}/${timestamp}-${sanitizedName}`

  console.log('📁 Upload path:', path);

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_ID)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    })

  if (uploadError) {
    console.error('❌ Upload error:', uploadError);
    throw new Error(`Upload failed: ${uploadError.message}`)
  }

  console.log('✅ File uploaded successfully to storage');

  const { data: publicUrlData } = supabase.storage
    .from(BUCKET_ID)
    .getPublicUrl(path)

  console.log('🔗 Public URL generated:', publicUrlData.publicUrl);

  return {
    url: publicUrlData.publicUrl,
    path,
    mimeType: file.type,
  }
}


