import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const isPlaceholder = (val?: string) => {
  return !val || val === "" || val.includes("add your");
};

const ALLOWED_MIME_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "application/pdf": ".pdf",
};

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

const uploadOnCloudinary = async (file: Blob): Promise<string | null> => {
  if (!file) {
    return null;
  }

  // Security Check 1: File size validation (Strict 5MB cap)
  if (file.size > MAX_FILE_SIZE_BYTES) {
    console.warn(`[UploadSecurity] Rejected file upload: Size (${file.size} bytes) exceeds 5MB limit.`);
    return null;
  }

  // Security Check 2: MIME Type Whitelisting
  const mime = (file.type || "").toLowerCase().trim();
  const fileExt = ALLOWED_MIME_TYPES[mime];
  if (!fileExt) {
    console.warn(`[UploadSecurity] Rejected file upload: Disallowed MIME type '${file.type}'.`);
    return null;
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Helper to safely store or encode file when Cloudinary is unavailable or fails
  const fallbackStorage = (): string => {
    const isServerless = Boolean(
      process.env.VERCEL ||
      process.env.AWS_LAMBDA_FUNCTION_NAME ||
      process.env.NETLIFY ||
      process.env.SERVERLESS
    );

    // If running in a standard local Node server with a writable filesystem, attempt public/uploads
    if (!isServerless) {
      try {
        const uploadsDir = path.join(process.cwd(), "public", "uploads");
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const fileName = `upload-${Date.now()}-${Math.random().toString(36).substring(7)}${fileExt}`;
        const filePath = path.join(uploadsDir, fileName);

        fs.writeFileSync(filePath, buffer);
        console.log(`[UploadFallback] Stored locally: /uploads/${fileName}`);
        return `/uploads/${fileName}`;
      } catch (localFsError: any) {
        console.warn(
          `[UploadFallback] Local filesystem write failed (${localFsError?.code || localFsError?.message}). Falling back to safe Data URI.`
        );
      }
    } else {
      console.log("[UploadFallback] Serverless environment detected. Using safe Data URI format.");
    }

    // Safe universal fallback: Data URI (works natively in <img src>, PDF viewers, and MongoDB without EROFS crash)
    return `data:${mime};base64,${buffer.toString("base64")}`;
  };

  // Check if Cloudinary keys are configured
  const hasValidCloudinary =
    !isPlaceholder(process.env.CLOUDINARY_CLOUD_NAME) &&
    !isPlaceholder(process.env.CLOUDINARY_API_KEY) &&
    !isPlaceholder(process.env.CLOUDINARY_API_SECRET);

  if (!hasValidCloudinary) {
    console.log("Using safe upload fallback (Cloudinary keys are placeholders or not configured)...");
    return fallbackStorage();
  }

  try {
    return await new Promise<string | null>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: "auto" },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result?.secure_url ?? null);
          }
        }
      );
      uploadStream.end(buffer);
    });
  } catch (error) {
    console.error("Cloudinary upload failed, falling back to safe storage:", error);
    return fallbackStorage();
  }
};

export default uploadOnCloudinary;
