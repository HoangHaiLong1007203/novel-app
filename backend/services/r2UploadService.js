import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const {
  R2_ENDPOINT,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET,
  R2_REGION,
  R2_PUBLIC_URL_BASE,
  R2_PUBLIC_URL_INCLUDE_BUCKET,
  MINIO_ENDPOINT,
  MINIO_ACCESS_KEY,
  MINIO_SECRET_KEY,
  MINIO_BUCKET,
  MINIO_FORCE_PATH_STYLE,
  MINIO_PUBLIC_URL,
} = process.env;

const useMinio = !!MINIO_ENDPOINT;

const endpoint = useMinio ? (MINIO_ENDPOINT) : (R2_ENDPOINT);
const accessKeyId = useMinio ? MINIO_ACCESS_KEY : R2_ACCESS_KEY_ID;
const secretAccessKey = useMinio ? MINIO_SECRET_KEY : R2_SECRET_ACCESS_KEY;
const bucket = useMinio ? MINIO_BUCKET : R2_BUCKET;
const publicUrlBase = useMinio ? (MINIO_PUBLIC_URL || MINIO_ENDPOINT) : (R2_PUBLIC_URL_BASE || R2_ENDPOINT);
const region = R2_REGION || "auto";
const forcePathStyle = useMinio ? (MINIO_FORCE_PATH_STYLE === "true" || true) : false;

if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
  console.warn("R2/MinIO config incomplete. Uploads will fail until env vars are provided.");
}

const s3client = new S3Client({
  region,
  endpoint,
  credentials: { accessKeyId, secretAccessKey },
  forcePathStyle,
});

export async function uploadBuffer({ buffer, key, contentType }) {
  if (!buffer) throw new Error("No buffer provided");
  const cmd = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: contentType || "application/octet-stream",
    // You can set CacheControl here, e.g. 'public, max-age=3600'
    CacheControl: "public, max-age=3600",
  });

  await s3client.send(cmd);

  return {
    key,
    url: getPublicUrl(key),
    mimeType: contentType || "application/octet-stream",
    size: buffer.length,
  };
}

export function getPublicUrl(key) {
  // Resolve values at call-time so callers that load env (e.g. via dotenv) first work
  const env = process.env;
  const useMinio = !!env.MINIO_ENDPOINT;
  const localBucket = useMinio ? (env.MINIO_BUCKET || bucket) : (env.R2_BUCKET || bucket);
  const localPublicUrlBase = useMinio
    ? (env.MINIO_PUBLIC_URL || env.MINIO_ENDPOINT)
    : (env.R2_PUBLIC_URL_BASE || env.R2_ENDPOINT);

  // Use the runtime include-bucket flag if present, otherwise fall back to module var
  const includeBucket = (typeof env.R2_PUBLIC_URL_INCLUDE_BUCKET === 'string')
    ? (env.R2_PUBLIC_URL_INCLUDE_BUCKET.toLowerCase() !== 'false')
    : (typeof R2_PUBLIC_URL_INCLUDE_BUCKET === 'string'
      ? (R2_PUBLIC_URL_INCLUDE_BUCKET.toLowerCase() !== 'false')
      : true);

  if (localPublicUrlBase) {
    const base = localPublicUrlBase.replace(/\/$/, '');
    if (includeBucket) return `${base}/${localBucket}/${encodeURI(key)}`;
    return `${base}/${encodeURI(key)}`;
  }

  const localEndpoint = env.R2_ENDPOINT || env.MINIO_ENDPOINT || endpoint;
  const eps = (localEndpoint || '').replace(/\/$/, '');
  return `${eps}/${localBucket}/${encodeURI(key)}`;
}

export async function getPresignedUrl(key, expiresIn = 3600) {
  const cmd = new GetObjectCommand({ Bucket: bucket, Key: key });
  return await getSignedUrl(s3client, cmd, { expiresIn });
}

// Fetch object body as string (useful for server-side proxying to avoid CORS)
export async function getObjectText(key) {
  const cmd = new GetObjectCommand({ Bucket: bucket, Key: key });
  const resp = await s3client.send(cmd);
  const body = resp.Body;
  if (!body) return null;
  // resp.Body can be a stream or blob-like; collect into string
  const chunks = [];
  for await (const chunk of body) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
}

export default {
  uploadBuffer,
  getPublicUrl,
  getPresignedUrl,
  getObjectText,
};
