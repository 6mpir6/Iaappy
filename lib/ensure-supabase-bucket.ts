import { createClient } from "@supabase/supabase-js"

const STORAGE_BUCKET = "creatomate-assets"

export async function ensureSupabaseBucket() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Supabase configuration is missing")
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()

    if (listError) {
      throw new Error(`Failed to list Supabase buckets: ${listError.message}`)
    }

    const bucketExists = buckets?.some((bucket) => bucket.name === STORAGE_BUCKET)

    if (!bucketExists) {
      console.log(`Creating storage bucket: ${STORAGE_BUCKET}`)
      const { error: createError } = await supabase.storage.createBucket(STORAGE_BUCKET, {
        public: true,
        fileSizeLimit: 50 * 1024 * 1024, // 50MB limit
      })

      if (createError) {
        throw new Error(`Failed to create Supabase bucket: ${createError.message}`)
      }

      console.log(`Successfully created bucket: ${STORAGE_BUCKET}`)
    } else {
      console.log(`Bucket ${STORAGE_BUCKET} already exists`)
    }

    return true
  } catch (error) {
    console.error("Error ensuring Supabase bucket exists:", error)
    throw error
  }
}
