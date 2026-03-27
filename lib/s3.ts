import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl as presignUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";

function getS3Config() {
  const region = process.env.AWS_REGION;
  const bucketName = process.env.AWS_BUCKET_NAME;

  if (!region) {
    throw new Error("Missing AWS_REGION environment variable");
  }

  if (!bucketName) {
    throw new Error("Missing AWS_BUCKET_NAME environment variable");
  }

  return { region, bucketName };
}

function getDownloadFilename(fileKey: string) {
  const raw = fileKey.split("/").pop() || "certificate";
  return raw.replace(/^[a-f0-9-]{36}-/, "").replace(/["\\]/g, "_");
}

export async function getSignedUrl(fileKey: string, options?: { download?: boolean }): Promise<string> {
  const { region, bucketName } = getS3Config();
  const s3Client = new S3Client({ region });
  const filename = getDownloadFilename(fileKey);

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: fileKey,
    ...(options?.download
      ? {
          ResponseContentDisposition: `attachment; filename="${filename}"`,
        }
      : {}),
  });

  return presignUrl(s3Client, command, { expiresIn: 60 });
}

function sanitizeFilename(filename: string) {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
}

function inferContentType(filename: string) {
  const lower = filename.toLowerCase();

  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".bmp")) return "image/bmp";
  if (lower.endsWith(".tif") || lower.endsWith(".tiff")) return "image/tiff";
  return "application/octet-stream";
}

export async function uploadCertificateToS3(file: File) {
  const { region, bucketName } = getS3Config();
  const s3Client = new S3Client({ region });

  const safeName = sanitizeFilename(file.name);
  const fileKey = `certificates/${randomUUID()}-${safeName}`;
  const arrayBuffer = await file.arrayBuffer();

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: fileKey,
    Body: Buffer.from(arrayBuffer),
    ContentType: file.type || inferContentType(file.name),
  });

  await s3Client.send(command);
  return fileKey;
}

export async function listCertificateKeys() {
  const { region, bucketName } = getS3Config();
  const s3Client = new S3Client({ region });

  const command = new ListObjectsV2Command({
    Bucket: bucketName,
    Prefix: "certificates/",
  });

  const result = await s3Client.send(command);
  return (result.Contents || []).map((item) => item.Key).filter((key): key is string => Boolean(key));
}

export async function deleteCertificateFromS3(fileKey: string) {
  const key = fileKey.trim();

  if (!key) {
    throw new Error("fileKey is required");
  }

  if (!key.startsWith("certificates/")) {
    throw new Error("Only files under certificates/ can be deleted");
  }

  const { region, bucketName } = getS3Config();
  const s3Client = new S3Client({ region });

  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  await s3Client.send(command);
}
