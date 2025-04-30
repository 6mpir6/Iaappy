"use server"

import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai"

interface WebsiteAnalysisResult {
  layout: { score: number; feedback: string }
  usability: { score: number; feedback: string }
  accessibility: { score: number; feedback: string }
  visualAppeal: { score: number; feedback: string }
  improvements: string[]
}

// Default analysis structure for fallbacks
const defaultAnalysisResult: WebsiteAnalysisResult = {
  layout: { score: 5, feedback: "Analysis could not be performed accurately." },
  usability: { score: 5, feedback: "Analysis could not be performed accurately." },
  accessibility: { score: 4, feedback: "Analysis could not be performed accurately. Assume basic checks needed." },
  visualAppeal: { score: 5, feedback: "Analysis could not be performed accurately." },
  improvements: [
    "Manual review recommended.",
    "Check semantic HTML structure.",
    "Verify responsiveness.",
    "Ensure accessibility compliance (alt text, contrasts).",
    "Optimize assets (images, scripts).",
  ],
}

// Safety Settings for Analysis
const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
]

// Helper function to extract JSON from text
async function extractJsonFromText(text: string): Promise<any> {
  try {
    // Look for JSON in code blocks first
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
    if (jsonMatch && jsonMatch[1]) {
      try {
        return JSON.parse(jsonMatch[1].trim())
      } catch (e) {
        console.warn("Failed to parse JSON from code block, trying full text.")
      }
    }

    // Try parsing the whole text (or the first likely JSON object)
    const objectMatch = text.match(/\{[\s\S]*\}/)
    if (objectMatch) {
      try {
        return JSON.parse(objectMatch[0])
      } catch (e) {
        console.warn("Failed to parse JSON from object match, trying direct parse.")
      }
    }

    // Try parsing the entire text directly
    try {
      return JSON.parse(text)
    } catch (e) {
      console.warn("Failed to parse direct JSON, attempting to extract structured data.")

      // For analysis response
      if (text.includes("layout") || text.includes("usability") || text.includes("accessibility")) {
        console.log("Attempting to extract analysis data from text...")

        // Try to extract scores if they exist in the text
        const layoutScoreMatch = text.match(/layout[^0-9]*(\d+)/i)
        const usabilityScoreMatch = text.match(/usability[^0-9]*(\d+)/i)
        const accessibilityScoreMatch = text.match(/accessibility[^0-9]*(\d+)/i)
        const visualAppealScoreMatch = text.match(/visual appeal[^0-9]*(\d+)/i)

        // Extract feedback if it exists
        const layoutFeedbackMatch = text.match(/layout[^:]*:([^.]+)/i)
        const usabilityFeedbackMatch = text.match(/usability[^:]*:([^.]+)/i)
        const accessibilityFeedbackMatch = text.match(/accessibility[^:]*:([^.]+)/i)
        const visualAppealFeedbackMatch = text.match(/visual appeal[^:]*:([^.]+)/i)

        // Extract improvements
        const improvements = []
        const improvementMatches = text.matchAll(/- ([^\n.]+)/g)
        for (const match of improvementMatches) {
          improvements.push(match[1].trim())
        }

        // If no improvements found, add some defaults
        if (improvements.length === 0) {
          improvements.push(
            "Improve semantic HTML structure",
            "Add responsive design elements",
            "Enhance accessibility features",
            "Optimize images",
            "Improve color contrast",
          )
        }

        return {
          layout: {
            score: layoutScoreMatch ? Number.parseInt(layoutScoreMatch[1]) : 5,
            feedback: layoutFeedbackMatch
              ? layoutFeedbackMatch[1].trim()
              : "Default layout feedback due to parsing error.",
          },
          usability: {
            score: usabilityScoreMatch ? Number.parseInt(usabilityScoreMatch[1]) : 5,
            feedback: usabilityFeedbackMatch
              ? usabilityFeedbackMatch[1].trim()
              : "Default usability feedback due to parsing error.",
          },
          accessibility: {
            score: accessibilityScoreMatch ? Number.parseInt(accessibilityScoreMatch[1]) : 4,
            feedback: accessibilityFeedbackMatch
              ? accessibilityFeedbackMatch[1].trim()
              : "Default accessibility feedback due to parsing error.",
          },
          visualAppeal: {
            score: visualAppealScoreMatch ? Number.parseInt(visualAppealScoreMatch[1]) : 5,
            feedback: visualAppealFeedbackMatch
              ? visualAppealFeedbackMatch[1].trim()
              : "Default visual appeal feedback due to parsing error.",
          },
          improvements: improvements,
        }
      }

      // Fallback if nothing works
      console.error("Could not extract valid JSON from response text:", text.substring(0, 500) + "...")
      throw new Error("Could not extract valid JSON from response")
    }
  } catch (error) {
    console.error("JSON extraction failed:", error)
    throw error // Re-throw the error after logging
  }
}

/**
 * Analyzes website code using Google Gemini.
 * @param html HTML code of the website
 * @param css CSS code of the website
 * @param websiteDescription Description of the website
 * @returns Analysis results as JSON object
 */
export async function analyzeWebsite(
  html: string,
  css: string,
  websiteDescription: string,
): Promise<WebsiteAnalysisResult> {
  console.log("Starting standalone website analysis...")
  try {
    // Initialize the Gemini API client
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      console.error("CRITICAL: GEMINI_API_KEY environment variable is not set.")
      throw new Error("Server configuration error: Missing Gemini API Key.")
    }

    const genAI = new GoogleGenAI({ apiKey })

    // FIXED: Use the correct model initialization with object parameter
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

    const systemInstruction = `You are a web development expert specializing in code review and analysis. Analyze the provided HTML and CSS code based on the website's description.
Provide scores (1-10) and feedback for Layout, Usability, Accessibility, and Visual Appeal (based on code structure and potential rendering).
Suggest 3-5 concrete improvements focusing on code quality, best practices, potential responsiveness issues, accessibility gaps (ARIA, semantics), and performance hints (e.g., image optimization needed?).
Respond ONLY with a valid JSON object adhering to this structure:
{
 "layout": {"score": number, "feedback": "string"},
 "usability": {"score": number, "feedback": "string"},
 "accessibility": {"score": number, "feedback": "string"},
 "visualAppeal": {"score": number, "feedback": "string"},
 "improvements": ["string", "string", ...]
}`

    const analysisPrompt = `Analyze the following HTML and CSS code for a website described as: "${websiteDescription}".

HTML (partial):
\`\`\`html
${html.substring(0, 4000)}...
\`\`\`

CSS (partial):
\`\`\`css
${css.substring(0, 4000)}...
\`\`\`

Evaluate layout, usability, accessibility (semantic HTML, ARIA potential), and visual appeal (based on code structure/styles). Provide scores (1-10), feedback, and 3-5 specific code-level improvement suggestions. Return ONLY the JSON object as specified.`

    // Analyze the website code
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: analysisPrompt }] }],
      generationConfig: {
        temperature: 0.3,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 4096,
      },
      systemInstructions: systemInstruction,
      safetySettings: SAFETY_SETTINGS,
    })

    // Check for response
    if (!result.response) {
      console.error("Error in standalone analyzeWebsite: Invalid or missing response object from Gemini.")
      throw new Error("Received invalid response structure from API.")
    }

    const responseText = result.response.text()
    console.log("Standalone analysis response received. Parsing JSON...")

    try {
      const analysisData = await extractJsonFromText(responseText)
      // Basic validation
      if (!analysisData.layout || !analysisData.improvements) {
        throw new Error("Parsed JSON is missing required fields (layout, improvements)")
      }
      return analysisData as WebsiteAnalysisResult
    } catch (error) {
      console.error("Failed to parse analysis JSON response:", error)
      console.error("Raw response text:", responseText) // Log the raw text for debugging
      throw new Error(`Failed to parse analysis response JSON. ${error instanceof Error ? error.message : ""}`)
    }
  } catch (error) {
    console.error("Error caught in analyzeWebsite (standalone) function:", error) // Log the specific error caught
    const message = error instanceof Error ? error.message : "Unknown error"
    // Return default analysis on error
    return {
      layout: { score: 5, feedback: `Analysis failed: ${message}. Layout could not be evaluated.` },
      usability: { score: 5, feedback: "Usability could not be evaluated." },
      accessibility: { score: 4, feedback: "Accessibility could not be evaluated. Assume improvements needed." },
      visualAppeal: { score: 5, feedback: "Visual appeal could not be evaluated." },
      improvements: [
        "Analysis failed, review code manually.",
        "Check semantic HTML.",
        "Ensure responsiveness.",
        "Add ARIA attributes.",
        "Optimize images if applicable.",
      ],
    }
  }
}
