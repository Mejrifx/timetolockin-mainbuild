import { supabase } from '@/lib/supabase'

export interface UploadedMedia {
  url: string
  path: string
  mimeType: string
}

const BUCKET_ID = 'gm-media'

export async function uploadFileToStorage(file: File): Promise<UploadedMedia> {
  const { data: userData, error: authError } = await supabase.auth.getUser()
  if (authError || !userData.user) {
    throw new Error('Not authenticated')
  }

  const userId = userData.user.id
  const timestamp = Date.now()
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `${userId}/${timestamp}-${sanitizedName}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_ID)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    })

  if (uploadError) {
    throw uploadError
  }

  const { data: publicUrlData } = supabase.storage
    .from(BUCKET_ID)
    .getPublicUrl(path)

  return {
    url: publicUrlData.publicUrl,
    path,
    mimeType: file.type,
  }
}


