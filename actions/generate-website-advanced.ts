"use server"
import { memoryStore } from "@/lib/memory-store"
import { v4 as uuidv4 } from "uuid"
import { getRandomPexelsPhoto, pexelsPhotoToDataUri } from "./pexels-api"
import { generateAdvancedWebsiteWithThinking } from "@/lib/gemini-thinking"

// Enhanced interfaces
interface WebsitePage {
  id: string
  name: string
  sections: Array<{
    id: string
    name: string
    purpose: string
    content: string
    hasImage: boolean
    imageDescription?: string
    hasModal?: boolean
    modalContent?: string
  }>
}

interface WebsitePlan {
  title: string
  description: string
  targetAudience: string
  pages: WebsitePage[]
  colorScheme: {
    primary: string
    secondary: string
    accent: string
    background: string
    text: string
  }
  typography: {
    headingFont: string
    bodyFont: string
  }
  features: string[]
  layout: string // "grid" | "multi-column" | "magazine" | "portfolio" | etc.
  interactiveElements: string[]
}

interface ContentBlock {
  id: string
  type: string // "hero" | "feature" | "testimonial" | "gallery" | "contact" | etc.
  title?: string
  content: string
  imageId?: string
  imageDescription?: string
  hasModal?: boolean
  modalContent?: string
  style?: Record<string, string>
}

interface CodeGenerationResponse {
  html: string
  css: string
  js: string
  isPartial?: boolean
  plan?: WebsitePlan
  contentBlocks?: ContentBlock[]
  interactiveElements?: string[]
  thinking?: string // Add thinking field
}

interface GenerateWebsiteResponse {
  code: CodeGenerationResponse
  generationId: string
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
function enhanceSearchTerm(term: string, sectionId: string, sectionName: string, websitePrompt: string): string {
  // Remove placeholder text
  let searchTerm = term.replace(/placeholder/gi, "").trim()

  if (!searchTerm || searchTerm.length < 5) {
    // Create a more descriptive search term based on section info
    if (sectionId.includes("hero") || sectionName.toLowerCase().includes("hero")) {
      searchTerm = `${websitePrompt} hero banner`
    } else if (sectionId.includes("about") || sectionName.toLowerCase().includes("about")) {
      searchTerm = `${websitePrompt} team office professional`
    } else if (sectionId.includes("feature") || sectionName.toLowerCase().includes("feature")) {
      searchTerm = `${websitePrompt} feature illustration`
    } else if (sectionId.includes("service") || sectionName.toLowerCase().includes("service")) {
      searchTerm = `${websitePrompt} service professional`
    } else if (sectionId.includes("product") || sectionName.toLowerCase().includes("product")) {
      searchTerm = `${websitePrompt} product showcase`
    } else if (sectionId.includes("contact") || sectionName.toLowerCase().includes("contact")) {
      searchTerm = `${websitePrompt} contact office`
    } else if (sectionId.includes("gallery") || sectionName.toLowerCase().includes("gallery")) {
      searchTerm = `${websitePrompt} gallery showcase`
    } else if (sectionId.includes("testimonial") || sectionName.toLowerCase().includes("testimonial")) {
      searchTerm = `${websitePrompt} testimonial people professional`
    } else {
      // Default to the website prompt with some enhancements
      searchTerm = `${websitePrompt} professional`
    }
  }

  // Add quality keywords for better results
  return `${searchTerm} high quality professional`
}

// Helper function to replace placeholder images with actual images
async function replaceImagesWithPexels(
  html: string,
  prompt: string,
  generationId: string,
  plan?: WebsitePlan,
  contentBlocks?: ContentBlock[],
): Promise<string> {
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
        let searchTerm = placeholder.alt
        let sectionId = placeholder.id
        let sectionName = ""

        // If we have a plan with pages and sections, try to find a more specific image description
        if (plan && plan.pages && Array.isArray(plan.pages)) {
          // Search through all pages and their sections
          for (const page of plan.pages) {
            if (Array.isArray(page.sections)) {
              const section = page.sections.find(
                (s) => placeholder.id.includes(s.id) || placeholder.id.toLowerCase().includes(s.name.toLowerCase()),
              )

              if (section) {
                sectionId = section.id
                sectionName = section.name
                if (section.imageDescription) {
                  searchTerm = section.imageDescription
                }
                break
              }
            }
          }
        }
        // If we have content blocks, try to find a more specific image description
        else if (contentBlocks && contentBlocks.length > 0) {
          const block = contentBlocks.find(
            (b) => b.imageId === placeholder.id || (b.imageId && placeholder.id.includes(b.imageId)),
          )
          if (block) {
            sectionId = block.id
            sectionName = block.type
            if (block.imageDescription) {
              searchTerm = block.imageDescription
            }
          }
        }

        // Enhance the search term for better relevance
        const enhancedSearchTerm = enhanceSearchTerm(searchTerm, sectionId, sectionName, prompt)

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

// Main function to generate a website using the multi-step agentic workflow with streaming
export async function generateWebsiteAdvanced(prompt: string): Promise<GenerateWebsiteResponse> {
  const generationId = uuidv4()
  console.log(`Starting advanced website generation process ID: ${generationId}`)

  await memoryStore.set(`generation:${generationId}`, JSON.stringify({ status: "starting", result: null }), {
    ex: 3600,
  }) // Expire after 1 hour
  await memoryStore.rpush(`generation:${generationId}:status`, "Advanced generation process initiated.")

  try {
    let thinking = ""
    let htmlCode = ""
    let cssCode = ""
    let jsCode = ""
    let jsonCode = ""

    // Use our thinking-enabled advanced generation with streaming
    const { plan, html, css, js, interactiveElements } = await generateAdvancedWebsiteWithThinking(
      prompt,
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
        } else if (codeType === "json") {
          jsonCode = code
            .replace(/```json\s*/, "")
            .replace(/```\s*$/, "")
            .trim()
          memoryStore.rpush(`generation:${generationId}:code:json`, jsonCode)
          memoryStore.rpush(`generation:${generationId}:status`, `📝 JSON data generation in progress...`)
        }
      },
      // Progress callback
      (status) => {
        memoryStore.rpush(`generation:${generationId}:status`, status)
      },
    )

    // Step 5: Replace placeholder images with actual images
    await memoryStore.set(`generation:${generationId}`, JSON.stringify({ status: "images", result: null }), {
      ex: 3600,
    })
    await memoryStore.rpush(`generation:${generationId}:status`, "Replacing placeholder images with Pexels photos...")
    const finalHtml = await replaceImagesWithPexels(html, prompt, generationId, plan)

    // In the generateWebsiteAdvanced function, ensure we're properly storing the code
    // Update the finalCode object creation to include all necessary fields
    const finalCode = {
      html: finalHtml,
      css,
      js,
      plan,
      interactiveElements,
      thinking,
      isPartial: false, // Explicitly mark as not partial
    }

    // Store the final result
    await memoryStore.set(`generation:${generationId}`, JSON.stringify({ status: "completed", result: finalCode }), {
      ex: 3600,
    })
    await memoryStore.rpush(`generation:${generationId}:status`, "🎉 Advanced website generation process finished!")

    console.log(`Advanced generation ${generationId} completed successfully.`)
    return {
      code: finalCode,
      generationId: generationId,
    }
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error during generation"
    console.error(`Error in generateWebsiteAdvanced function (ID: ${generationId}):`, error)

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
