/**
 * Helper to upload files to the upload API from CLI/scripts
 * Used by automated processes to upload base64-encoded files
 */

interface FileToUpload {
  name: string;
  data: string; // base64 encoded
}

export async function uploadFilesViaApi(
  files: FileToUpload[],
  apiUrl: string = "http://localhost:3000/api/upload"
): Promise<{
  success: boolean;
  message: string;
  files?: Array<{
    filename: string;
    url: string;
    size: number;
    uploadedAt: string;
  }>;
  error?: string;
}> {
  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ files }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    return {
      success: false,
      message: "Failed to upload files",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getUploadedFilesViaApi(
  apiUrl: string = "http://localhost:3000/api/upload"
): Promise<
  Array<{
    filename: string;
    url: string;
    size: number;
    uploadedAt: string;
  }> | null
> {
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    return data.files || null;
  } catch (error) {
    console.error("Error fetching uploaded files:", error);
    return null;
  }
}
