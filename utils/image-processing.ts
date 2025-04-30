/**
 * Converts a data URI to a blob URL that can be used with external APIs
 * @param dataUri The data URI to convert
 * @returns A Promise that resolves to a blob URL
 */
export async function dataUriToExternalUrl(dataUri: string): Promise<string> {
  // In a real implementation, you would upload the image to a storage service
  // and return the URL. For now, we'll just return the data URI.
  return dataUri
}

/**
 * Extracts the MIME type from a data URI
 * @param dataUri The data URI
 * @returns The MIME type or null if not found
 */
export function getMimeTypeFromDataUri(dataUri: string): string | null {
  const match = dataUri.match(/^data:([^;]+);base64,/)
  return match ? match[1] : null
}

/**
 * Checks if a string is a data URI
 * @param str The string to check
 * @returns True if the string is a data URI, false otherwise
 */
export function isDataUri(str: string): boolean {
  return str.startsWith("data:")
}
