"use server";

interface CreatomateRenderStatus {
  id: string;
  status: string;
  url?: string;
  error_message?: string;
}

export interface CreatomateStatusResponse {
  success: boolean;
  status?: string;
  url?: string;
  error?: string;
  errorMessage?: string;
}

export async function getCreatomateRenderStatus(
  renderId: string
): Promise<CreatomateStatusResponse> {
  const apiKey = process.env.CREATOMATE_API_KEY;
  if (!apiKey) {
    return { success: false, error: "Missing Creatomate API Key" };
  }
  if (!renderId) {
    return { success: false, error: "Render ID is required" };
  }
  const url = `https://api.creatomate.com/v1/renders/${renderId}`;
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });
    const data: CreatomateRenderStatus = await res.json();
    if (!res.ok) {
      return {
        success: false,
        error: data.error_message || `API error ${res.status}`,
      };
    }
    return {
      success: true,
      status: data.status,
      url: data.url,
      errorMessage: data.error_message,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Unknown error checking render status",
    };
  }
}
