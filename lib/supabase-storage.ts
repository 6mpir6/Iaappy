import { createClient } from "@supabase/supabase-js"

// Initialize Supabase client
export function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase configuration is missing")
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

// Ensure the creatomate-assets bucket exists
export async function ensureCreatomateBucket() {
  try {
    const supabase = getSupabaseClient()

    // Check if the bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()

    if (listError) {
      console.error("Error listing Supabase buckets:", listError)
      return false
    }

    const bucketExists = buckets?.some((bucket) => bucket.name === "creatomate-assets")

    if (!bucketExists) {
      // Create the bucket if it doesn't exist
      const { error: createError } = await supabase.storage.createBucket("creatomate-assets", {
        public: true, // Make the bucket public
        fileSizeLimit: 10485760, // 10MB limit
      })

      if (createError) {
        console.error("Error creating Supabase bucket:", createError)
        return false
      }

      console.log("Created 'creatomate-assets' bucket in Supabase storage")
    }

    return true
  } catch (error) {
    console.error("Error ensuring Supabase bucket exists:", error)
    return false
  }
}
