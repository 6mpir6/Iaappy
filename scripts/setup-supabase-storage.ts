import { ensureCreatomateBucket } from "../lib/supabase-storage"

async function setupStorage() {
  console.log("Setting up Supabase storage for Creatomate assets...")

  try {
    const success = await ensureCreatomateBucket()

    if (success) {
      console.log("✅ Supabase storage setup complete!")
    } else {
      console.error("❌ Failed to set up Supabase storage.")
      process.exit(1)
    }
  } catch (error) {
    console.error("Error during Supabase storage setup:", error)
    process.exit(1)
  }
}

// Run the setup
setupStorage()
