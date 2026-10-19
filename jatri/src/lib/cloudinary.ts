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

  // ✅ Fallback to local storage if Cloudinary keys are placeholders or not set
  if (
    isPlaceholder(process.env.CLOUDINARY_CLOUD_NAME) ||
    isPlaceholder(process.env.CLOUDINARY_API_KEY) ||
    isPlaceholder(process.env.CLOUDINARY_API_SECRET)
  ) {
    try {
      console.log("Using local storage fallback for uploads (Cloudinary keys are placeholders)...");
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      const uploadsDir = path.join(process.cwd(), "public", "uploads");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Generate a unique filename using timestamp and secure random string with mapped extension
      const fileName = `upload-${Date.now()}-${Math.random().toString(36).substring(7)}${fileExt}`;
      const filePath = path.join(uploadsDir, fileName);

      fs.writeFileSync(filePath, buffer);
      return `/uploads/${fileName}`;
    } catch (localError) {
      console.error("Local upload fallback failed:", localError);
      return null;
    }
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return new Promise((resolve, reject) => {
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
    console.error("Cloudinary upload failed:", error);
    return null;
  }
};

export default uploadOnCloudinary;