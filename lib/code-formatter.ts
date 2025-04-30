/**
 * Utility functions for formatting code
 */

/**
 * Format HTML code for better display
 * @param html HTML code to format
 * @returns Formatted HTML code
 */
export function formatHtml(html: string): string {
  // Basic formatting - this could be enhanced with a proper HTML formatter library
  try {
    if (!html || typeof html !== "string") {
      console.warn("Invalid HTML passed to formatter:", html)
      return html || "<!-- No HTML content -->"
    }

    // Clean up whitespace
    const formatted = html
      .replace(/>\s+</g, ">\n<") // Add newlines between tags
      .replace(/(<\/[^>]+>)/g, "$1\n") // Add newline after closing tags
      .replace(/(<[^/][^>]*[^/]>)\s*/g, "$1\n") // Add newline after opening tags
      .replace(/^\s+|\s+$/g, "") // Trim whitespace

    // Indent based on tag nesting
    const lines = formatted.split("\n")
    let indent = 0
    const indentSize = 2
    const result: string[] = []

    lines.forEach((line) => {
      if (line.match(/<\/[^>]+>/)) {
        // Closing tag, decrease indent before adding
        indent -= indentSize
      }

      // Add line with proper indentation
      if (line.trim()) {
        result.push(" ".repeat(Math.max(0, indent)) + line)
      }

      if (line.match(/<[^/][^>]*[^/]>/) && !line.match(/<(img|br|hr|input|link|meta)[^>]*>/i)) {
        // Opening tag (but not self-closing), increase indent after adding
        indent += indentSize
      }
    })

    return result.join("\n")
  } catch (error) {
    console.error("Error formatting HTML:", error)
    return html || "<!-- No HTML content -->" // Return original if formatting fails
  }
}

/**
 * Format CSS code for better display
 * @param css CSS code to format
 * @returns Formatted CSS code
 */
export function formatCss(css: string): string {
  try {
    if (!css || typeof css !== "string") {
      console.warn("Invalid CSS passed to formatter:", css)
      return css || "/* No CSS content */"
    }

    // Basic CSS formatting
    return css
      .replace(/\s*{\s*/g, " {\n  ") // Format opening braces
      .replace(/;\s*/g, ";\n  ") // Add newline after semicolons
      .replace(/\s*}\s*/g, "\n}\n") // Format closing braces
      .replace(/\n\s*\n/g, "\n") // Remove empty lines
      .replace(/^\s+|\s+$/g, "") // Trim whitespace
  } catch (error) {
    console.error("Error formatting CSS:", error)
    return css || "/* No CSS content */" // Return original if formatting fails
  }
}

/**
 * Format JavaScript code for better display
 * @param js JavaScript code to format
 * @returns Formatted JavaScript code
 */
export function formatJs(js: string): string {
  try {
    if (!js || typeof js !== "string") {
      console.warn("Invalid JavaScript passed to formatter:", js)
      return js || "// No JavaScript content"
    }

    // Basic JS formatting - this is very simplistic
    // For production, consider using a proper JS formatter
    return js
      .replace(/{\s*/g, "{\n  ") // Format opening braces
      .replace(/;\s*/g, ";\n  ") // Add newline after semicolons
      .replace(/}\s*/g, "}\n") // Format closing braces
      .replace(/\n\s*\n/g, "\n") // Remove empty lines
      .replace(/^\s+|\s+$/g, "") // Trim whitespace
  } catch (error) {
    console.error("Error formatting JavaScript:", error)
    return js || "// No JavaScript content" // Return original if formatting fails
  }
}
