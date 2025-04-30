/**
 * Updates navigation links to replace image-generator with video-generator
 * @param href The original href value
 * @returns The updated href value
 */
export function updateNavigationLink(href: string): string {
  if (href === "/image-generator") {
    return "/video-generator"
  }
  return href
}
