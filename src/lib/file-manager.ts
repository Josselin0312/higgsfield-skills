import fs from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export interface ManagedFile {
  filename: string;
  filepath: string;
  url: string;
  size: number;
  uploadedAt: string;
}

/**
 * List all uploaded files
 */
export async function listUploadedFiles(): Promise<ManagedFile[]> {
  try {
    const files = await fs.readdir(UPLOAD_DIR);
    const fileStats = await Promise.all(
      files.map(async (file) => {
        const filepath = path.join(UPLOAD_DIR, file);
        const stat = await fs.stat(filepath);
        return {
          filename: file,
          filepath,
          url: `/uploads/${file}`,
          size: stat.size,
          uploadedAt: stat.mtime.toISOString(),
        };
      })
    );

    return fileStats.sort((a, b) =>
      new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );
  } catch (error) {
    console.error("Error listing files:", error);
    return [];
  }
}

/**
 * Get a specific file by name
 */
export async function getUploadedFile(
  filename: string
): Promise<ManagedFile | null> {
  try {
    const filepath = path.join(UPLOAD_DIR, filename);

    // Security: prevent directory traversal
    if (!filepath.startsWith(UPLOAD_DIR)) {
      console.error("Invalid file path");
      return null;
    }

    const stat = await fs.stat(filepath);
    return {
      filename,
      filepath,
      url: `/uploads/${filename}`,
      size: stat.size,
      uploadedAt: stat.mtime.toISOString(),
    };
  } catch (error) {
    console.error("Error getting file:", error);
    return null;
  }
}

/**
 * Get file by pattern (useful for finding latest image, head, body, etc.)
 * Example: findFileByPattern("head") returns the latest file with "head" in name
 */
export async function findFileByPattern(pattern: string): Promise<ManagedFile | null> {
  const files = await listUploadedFiles();
  const matching = files.filter((f) =>
    f.filename.toLowerCase().includes(pattern.toLowerCase())
  );
  return matching.length > 0 ? matching[0] : null;
}

/**
 * Get file content as Buffer (for processing)
 */
export async function getFileContent(filename: string): Promise<Buffer | null> {
  try {
    const file = await getUploadedFile(filename);
    if (!file) return null;
    return await fs.readFile(file.filepath);
  } catch (error) {
    console.error("Error reading file:", error);
    return null;
  }
}

/**
 * Get file content as base64 (for API calls)
 */
export async function getFileAsBase64(filename: string): Promise<string | null> {
  try {
    const content = await getFileContent(filename);
    if (!content) return null;
    return content.toString("base64");
  } catch (error) {
    console.error("Error converting to base64:", error);
    return null;
  }
}

/**
 * Get file content as URL (for Higgsfield)
 * Returns the public URL if available
 */
export async function getFileAsUrl(filename: string): Promise<string | null> {
  const file = await getUploadedFile(filename);
  return file ? file.url : null;
}

/**
 * Get recent carousel images (head, body, instagram)
 * Useful for carousel automation
 */
export async function getCarouselImages(): Promise<{
  instagram: ManagedFile | null;
  head: ManagedFile | null;
  body: ManagedFile | null;
}> {
  const files = await listUploadedFiles();

  const instagram = files.find(
    (f) => f.filename.toLowerCase().includes("instagram") ||
           f.filename.toLowerCase().includes("loft") ||
           f.filename.toLowerCase().includes("portrait")
  ) || files[0];

  const head = files.find(
    (f) => f.filename.toLowerCase().includes("head") ||
           f.filename.toLowerCase().includes("face") ||
           f.filename.toLowerCase().includes("blonde")
  );

  const body = files.find(
    (f) => f.filename.toLowerCase().includes("body") ||
           f.filename.toLowerCase().includes("legs") ||
           f.filename.toLowerCase().includes("crop")
  );

  return { instagram: instagram || null, head: head || null, body: body || null };
}

/**
 * Debug: Log all uploaded files
 */
export async function debugListFiles() {
  const files = await listUploadedFiles();
  console.log("\n📁 Uploaded Files:");
  console.log("==================");
  files.forEach((f) => {
    console.log(`📄 ${f.filename}`);
    console.log(`   URL: ${f.url}`);
    console.log(`   Size: ${f.size} bytes`);
    console.log(`   Uploaded: ${f.uploadedAt}\n`);
  });
}
