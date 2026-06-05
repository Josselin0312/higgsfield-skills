import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "100mb",
    },
  },
};

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

async function ensureUploadDir() {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  } catch (error) {
    console.error("Failed to create upload directory:", error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureUploadDir();

    const contentType = req.headers.get("content-type") || "";
    const uploadedFiles: {
      filename: string;
      url: string;
      size: number;
      uploadedAt: string;
    }[] = [];

    // Handle JSON with base64 files
    if (contentType.includes("application/json")) {
      const body = await req.json();
      const files = body.files || [];

      if (!files || files.length === 0) {
        return NextResponse.json(
          { error: "No files provided" },
          { status: 400 }
        );
      }

      for (const file of files) {
        if (!file.name || !file.data) {
          continue;
        }

        const buffer = Buffer.from(file.data, "base64");
        const filename = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
        const filepath = path.join(UPLOAD_DIR, filename);

        await fs.writeFile(filepath, buffer);

        uploadedFiles.push({
          filename,
          url: `/uploads/${filename}`,
          size: buffer.byteLength,
          uploadedAt: new Date().toISOString(),
        });

        console.log(`✅ Uploaded (base64): ${filename}`);
      }
    }
    // Handle FormData (from web interface)
    else if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const files = formData.getAll("files") as File[];

      if (!files || files.length === 0) {
        return NextResponse.json(
          { error: "No files provided" },
          { status: 400 }
        );
      }

      for (const file of files) {
        const buffer = await file.arrayBuffer();
        const filename = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
        const filepath = path.join(UPLOAD_DIR, filename);

        await fs.writeFile(filepath, Buffer.from(buffer));

        uploadedFiles.push({
          filename,
          url: `/uploads/${filename}`,
          size: buffer.byteLength,
          uploadedAt: new Date().toISOString(),
        });

        console.log(`✅ Uploaded (formdata): ${filename}`);
      }
    } else {
      return NextResponse.json(
        { error: "Unsupported content type" },
        { status: 400 }
      );
    }

    if (uploadedFiles.length === 0) {
      return NextResponse.json(
        { error: "No valid files to upload" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${uploadedFiles.length} file(s) uploaded successfully`,
      files: uploadedFiles,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await ensureUploadDir();

    const files = await fs.readdir(UPLOAD_DIR);
    const fileStats = await Promise.all(
      files.map(async (file) => {
        const filepath = path.join(UPLOAD_DIR, file);
        const stat = await fs.stat(filepath);
        return {
          filename: file,
          url: `/uploads/${file}`,
          size: stat.size,
          uploadedAt: stat.mtime.toISOString(),
        };
      })
    );

    return NextResponse.json({
      success: true,
      files: fileStats.sort((a, b) =>
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
      ),
    });
  } catch (error) {
    console.error("List error:", error);
    return NextResponse.json(
      { error: "Failed to list files" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { filename } = await req.json();

    if (!filename) {
      return NextResponse.json(
        { error: "Filename required" },
        { status: 400 }
      );
    }

    const filepath = path.join(UPLOAD_DIR, filename);

    // Security: prevent directory traversal
    if (!filepath.startsWith(UPLOAD_DIR)) {
      return NextResponse.json(
        { error: "Invalid filename" },
        { status: 400 }
      );
    }

    await fs.unlink(filepath);

    console.log(`🗑️ Deleted: ${filename}`);

    return NextResponse.json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}
