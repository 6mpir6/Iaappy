"use server"
import { memoryStore } from "@/lib/memory-store"
import { v4 as uuidv4 } from "uuid"
import { getRandomPexelsPhoto, pexelsPhotoToDataUri } from "./pexels-api"
import { generateWebsiteWithThinking } from "@/lib/gemini-thinking"
import { processFilesForWebsiteGeneration } from "@/lib/file-processor"

// Basic interfaces
interface CodeGenerationResponse {
  html: string
  css: string
  js: string
  isPartial?: boolean
  thinking?: string // Add thinking field
}

interface GenerateWebsiteResponse {
  code: CodeGenerationResponse
  generationId: string
}

interface FileAttachment {
  data: string
  mimeType: string
}

// Helper function to extract image placeholders from HTML
function extractImagePlaceholders(html: string): Array<{ id: string; alt: string }> {
  const placeholders = []
  const regex = /<img[^>]*id=["']([^"']+)["'][^>]*alt=["']([^"']+)["'][^>]*>/g
  let match

  while ((match = regex.exec(html)) !== null) {
    placeholders.push({
      id: match[1],
      alt: match[2],
    })
  }

  return placeholders
}

// Helper function to enhance search terms for better image relevance
function enhanceSearchTerm(term: string, imageId: string, websitePrompt: string): string {
  // Remove placeholder text
  let searchTerm = term.replace(/placeholder/gi, "").trim()

  if (!searchTerm || searchTerm.length < 5) {
    // Create a more descriptive search term based on image ID
    if (imageId.includes("hero")) {
      searchTerm = `${websitePrompt} hero banner`
    } else if (imageId.includes("about")) {
      searchTerm = `${websitePrompt} team office professional`
    } else if (imageId.includes("feature")) {
      searchTerm = `${websitePrompt} feature illustration`
    } else if (imageId.includes("service")) {
      searchTerm = `${websitePrompt} service professional`
    } else if (imageId.includes("product")) {
      searchTerm = `${websitePrompt} product showcase`
    } else if (imageId.includes("contact")) {
      searchTerm = `${websitePrompt} contact office`
    } else if (imageId.includes("gallery")) {
      searchTerm = `${websitePrompt} gallery showcase`
    } else if (imageId.includes("testimonial")) {
      searchTerm = `${websitePrompt} testimonial people professional`
    } else if (imageId.includes("logo")) {
      searchTerm = `${websitePrompt} logo icon`
    } else {
      // Default to the website prompt with some enhancements
      searchTerm = `${websitePrompt} professional`
    }
  }

  // Add quality keywords for better results
  return `${searchTerm} high quality professional`
}

// Helper function to replace placeholder images with actual images
async function replaceImagesWithPexels(html: string, prompt: string, generationId: string): Promise<string> {
  try {
    const placeholders = extractImagePlaceholders(html)
    let updatedHtml = html

    await memoryStore.rpush(
      `generation:${generationId}:status`,
      `Found ${placeholders.length} image placeholders to replace.`,
    )

    for (const placeholder of placeholders) {
      try {
        // Generate search term based on placeholder id and alt text
        const enhancedSearchTerm = enhanceSearchTerm(placeholder.alt, placeholder.id, prompt)

        await memoryStore.rpush(`generation:${generationId}:status`, `Searching Pexels for: "${enhancedSearchTerm}"`)

        // Get a relevant image from Pexels
        const photos = await getRandomPexelsPhoto(enhancedSearchTerm, 1)

        if (photos && photos.length > 0) {
          // Convert to data URI
          const dataUri = await pexelsPhotoToDataUri(photos[0])

          // Add to image previews
          await memoryStore.rpush(
            `generation:${generationId}:images`,
            JSON.stringify({
              id: placeholder.id,
              url: dataUri,
              pexelsId: photos[0].id,
              description: enhancedSearchTerm,
            }),
          )

          // Replace in HTML
          const imgRegex = new RegExp(`<img[^>]*id=["']${placeholder.id}["'][^>]*>`, "g")
          updatedHtml = updatedHtml.replace(
            imgRegex,
            `<img id="${placeholder.id}" src="${dataUri}" alt="${placeholder.alt}" class="pexels-img">`,
          )

          await memoryStore.rpush(`generation:${generationId}:status`, `✅ Replaced image: ${placeholder.id}`)
        }
      } catch (imgError) {
        console.error(`Error replacing image ${placeholder.id}:`, imgError)
        await memoryStore.rpush(`generation:${generationId}:status`, `❌ Failed to replace image: ${placeholder.id}`)
      }
    }

    return updatedHtml
  } catch (error) {
    console.error("Error replacing images with Pexels:", error)
    await memoryStore.rpush(`generation:${generationId}:status`, `❌ Error replacing images: ${error.message}`)
    return html // Return original HTML if there's an error
  }
}

// Update the generateWebsite function to use streaming and display code as it's generated
export async function generateWebsite(
  prompt: string,
  fileAttachments?: FileAttachment[],
): Promise<GenerateWebsiteResponse> {
  const generationId = uuidv4()
  console.log(`Starting website generation process ID: ${generationId}`)

  await memoryStore.set(`generation:${generationId}`, JSON.stringify({ status: "starting", result: null }), {
    ex: 3600,
  }) // Expire after 1 hour
  await memoryStore.rpush(`generation:${generationId}:status`, "Generation process initiated.")

  try {
    // Step 1: Process file attachments if provided
    let enhancedPrompt = prompt
    if (fileAttachments && fileAttachments.length > 0) {
      await memoryStore.rpush(
        `generation:${generationId}:status`,
        `Processing ${fileAttachments.length} attached files...`,
      )

      try {
        // Process files with Gemini for multimodal understanding
        const fileAnalysis = await processFilesForWebsiteGeneration(prompt, fileAttachments)

        // Enhance the prompt with file analysis
        enhancedPrompt = `${prompt}\n\nBased on the attached files, here's additional context: ${fileAnalysis}`

        await memoryStore.rpush(
          `generation:${generationId}:status`,
          `✅ Files processed successfully. Enhanced prompt with file analysis.`,
        )
      } catch (fileError) {
        console.error("Error processing file attachments:", fileError)
        await memoryStore.rpush(
          `generation:${generationId}:status`,
          `⚠️ Warning: Could not process file attachments. Continuing with original prompt.`,
        )
      }
    }

    // Step 2: Generate basic website code with thinking
    await memoryStore.set(`generation:${generationId}`, JSON.stringify({ status: "code", result: null }), { ex: 3600 })

    let thinking = ""
    let htmlCode = ""
    let cssCode = ""
    let jsCode = ""

    // Use our new thinking-enabled generation with streaming
    const { html, css, js } = await generateWebsiteWithThinking(
      enhancedPrompt,
      // Thinking callback
      (thinkingUpdate) => {
        thinking = thinkingUpdate
        memoryStore.rpush(`generation:${generationId}:thinking`, thinkingUpdate)

        // Extract a short summary from the thinking update for status
        const thinkingSummary = thinkingUpdate.split(".")[0] // Just the first sentence
        memoryStore.rpush(`generation:${generationId}:status`, `💭 ${thinkingSummary}...`)
      },
      // Code generation callback
      (codeType, code) => {
        // Store code snippets as they're generated
        if (codeType === "html") {
          htmlCode = code
            .replace(/```html\s*/, "")
            .replace(/```\s*$/, "")
            .trim()
          memoryStore.rpush(`generation:${generationId}:code:html`, htmlCode)
          memoryStore.rpush(`generation:${generationId}:status`, `📝 HTML code generation in progress...`)
        } else if (codeType === "css") {
          cssCode = code
            .replace(/```css\s*/, "")
            .replace(/```\s*$/, "")
            .trim()
          memoryStore.rpush(`generation:${generationId}:code:css`, cssCode)
          memoryStore.rpush(`generation:${generationId}:status`, `📝 CSS code generation in progress...`)
        } else if (codeType === "javascript") {
          jsCode = code
            .replace(/```javascript\s*/, "")
            .replace(/```\s*$/, "")
            .trim()
          memoryStore.rpush(`generation:${generationId}:code:js`, jsCode)
          memoryStore.rpush(`generation:${generationId}:status`, `📝 JavaScript code generation in progress...`)
        }
      },
      // Progress callback
      (status) => {
        memoryStore.rpush(`generation:${generationId}:status`, status)
      },
    )

    await memoryStore.rpush(`generation:${generationId}:status`, "✅ Code generation complete.")

    // Step 3: Replace placeholder images with Pexels images
    await memoryStore.set(`generation:${generationId}`, JSON.stringify({ status: "images", result: null }), {
      ex: 3600,
    })
    await memoryStore.rpush(`generation:${generationId}:status`, "Replacing placeholder images with Pexels photos...")

    // Replace placeholders with actual images
    const updatedHtml = await replaceImagesWithPexels(html, prompt, generationId)

    await memoryStore.rpush(`generation:${generationId}:status`, "✅ Image replacement complete.")

    // Create the final code object
    const finalCode = {
      html: updatedHtml,
      css,
      js,
      thinking,
      isPartial: false, // Explicitly mark as not partial
    }

    // Store the final result
    await memoryStore.set(`generation:${generationId}`, JSON.stringify({ status: "completed", result: finalCode }), {
      ex: 3600,
    })
    await memoryStore.rpush(`generation:${generationId}:status`, "🎉 Website generation process finished!")

    console.log(`Generation ${generationId} completed successfully.`)
    return {
      code: finalCode,
      generationId: generationId,
    }
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error during generation"
    console.error(`Error in generateWebsite function (ID: ${generationId}):`, error)

    // Update status on failure
    try {
      await memoryStore.rpush(`generation:${generationId}:status`, `❌ Critical Error: ${errorMessage}`)
      await memoryStore.set(`generation:${generationId}`, JSON.stringify({ status: "failed", error: errorMessage }), {
        ex: 3600,
      })
    } catch (storeError) {
      console.error("Failed to update Redis status on error:", storeError)
    }

    // Return a basic fallback website
    return {
      code: {
        html: `<!DOCTYPE html><html><head><title>Error</title></head><body><h1>Generation Error</h1><p>${errorMessage}</p></body></html>`,
        css: "body { font-family: sans-serif; color: #333; max-width: 800px; margin: 0 auto; padding: 2rem; }",
        js: "console.error('Website generation failed:', '" + errorMessage.replace(/'/g, "\\'") + "');",
      },
      generationId: generationId,
    }
  }
}
