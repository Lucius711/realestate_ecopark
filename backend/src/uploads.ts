import { BadRequestException, Controller, Post, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { randomBytes } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import { resolve } from "path";
import { JwtGuard, Roles } from "./auth";

export const UPLOAD_DIR = resolve(__dirname, "../uploads");

// Our own extension per allowed type — the client's file name/extension is never used.
// No AVIF/SVG: Next's image optimizer has had RCE bugs on those inputs (GHSA-2xp9-vwfh-vxw4, GHSA-2464-fhr4-w9xw).
const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "application/pdf": "pdf" };
const MAX_BYTES = 15 * 1024 * 1024;

const r2 = () =>
  process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && process.env.R2_BUCKET && process.env.R2_PUBLIC_URL
    ? {
        client: new S3Client({
          region: "auto",
          endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
          credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY },
        }),
        bucket: process.env.R2_BUCKET,
        publicUrl: process.env.R2_PUBLIC_URL.replace(/\/$/, ""),
      }
    : null;

/** Where uploaded files are publicly served from: R2 (production) or this API's /uploads (local). */
export const uploadBase = () => (process.env.R2_PUBLIC_URL ? process.env.R2_PUBLIC_URL.replace(/\/$/, "") : `${(process.env.API_PUBLIC_URL ?? "http://localhost:4000").replace(/\/$/, "")}/uploads`) + "/";

// Magic bytes, so a renamed .html/.svg can't pass as an image.
function sniff(buf: Buffer, mime: string) {
  const hex = buf.subarray(0, 12).toString("hex");
  switch (mime) {
    case "image/jpeg":
      return hex.startsWith("ffd8ff");
    case "image/png":
      return hex.startsWith("89504e47");
    case "image/gif":
      return hex.startsWith("47494638");
    case "image/webp":
      return hex.startsWith("52494646") && buf.subarray(8, 12).toString() === "WEBP";
    case "application/pdf":
      return buf.subarray(0, 5).toString() === "%PDF-";
  }
  return false;
}

/** POST /admin/uploads (multipart field "file") → { url }. Images and brochure PDFs, staff only. */
@Controller("admin/uploads")
@UseGuards(JwtGuard)
@Roles("admin")
export class UploadsController {
  @Post()
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: MAX_BYTES, files: 1 } }))
  async upload(@UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException("Chưa chọn file");
    const ext = TYPES[file.mimetype];
    if (!ext || !sniff(file.buffer, file.mimetype)) throw new BadRequestException("Chỉ nhận ảnh JPG, PNG, WebP, GIF hoặc file PDF");
    const key = `${new Date().toISOString().slice(0, 7)}/${randomBytes(12).toString("hex")}.${ext}`;
    const store = r2();
    if (store) {
      await store.client.send(new PutObjectCommand({ Bucket: store.bucket, Key: key, Body: file.buffer, ContentType: file.mimetype, CacheControl: "public, max-age=31536000, immutable" }));
      return { url: `${store.publicUrl}/${key}` };
    }
    const path = resolve(UPLOAD_DIR, key);
    await mkdir(resolve(path, ".."), { recursive: true });
    await writeFile(path, file.buffer);
    return { url: `${uploadBase()}${key}` };
  }
}
