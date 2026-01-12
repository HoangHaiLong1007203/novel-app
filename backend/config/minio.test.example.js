// MinIO test configuration example for local/dev use
// Usage: copy to backend/config/minio.test.js or set equivalent env vars

module.exports = {
  endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000',
  accessKeyId: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretAccessKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
  region: process.env.MINIO_REGION || 'us-east-1',
  bucket: process.env.MINIO_BUCKET || 'novel-chapters-test',
  forcePathStyle: process.env.MINIO_FORCE_PATH_STYLE === 'true' || true,
  useSSL: process.env.MINIO_USE_SSL === 'true' || false,
  // Public URL base for generated object URLs (optional). If empty, SDK endpoint + bucket/object path is used.
  publicUrlBase: process.env.MINIO_PUBLIC_URL || 'http://localhost:9000',
};
