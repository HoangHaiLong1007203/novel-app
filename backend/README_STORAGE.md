# Storage configuration (Cloudflare R2 + optional MinIO)

This project stores long-form chapter content as files on an S3-compatible bucket (Cloudflare R2 in production, MinIO for local testing). This document explains how to configure both environments and what data you must supply before running uploads/migrations.

## Required environment variables

Add the following keys to `backend/.env` (see `.env.example`):

| Key | Description |
| --- | --- |
| `R2_ENDPOINT` | Cloudflare R2 S3 endpoint, e.g. `https://<account-id>.r2.cloudflarestorage.com` |
| `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | Access credentials with write permission |
| `R2_BUCKET` | Bucket name dedicated to chapter files |
| `R2_PUBLIC_URL_BASE` | Public base URL (use the R2 custom domain for unlocked chapters) |
| `R2_REGION` | Region string (R2 uses `auto`) |

Optional MinIO override keys (`MINIO_*`) let you point the uploader to a local S3-compatible endpoint for development. When `MINIO_ENDPOINT` is present, the uploader automatically switches to MinIO and forces path-style URLs.

## Cloudflare R2 setup checklist

1. Create a bucket (e.g. `novel-chapters`).
2. Enable public read access for unlocked chapters (via R2 Access Policies or custom domain with CDN). Locked chapters use presigned links automatically.
3. Apply the CORS config required by the reader app:

```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["Content-Type"],
    "MaxAgeSeconds": 3600
  }
]
```

4. Generate an API token with read/write permissions for the bucket and copy the Access Key / Secret.
5. (Optional) Attach a custom domain to serve unlocked chapters with friendly URLs and better caching.

## Local MinIO quick start

Use this only when you cannot reach R2 from your dev machine.

```bash
docker run -p 9000:9000 -p 9090:9090 \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin \
  -v $PWD/minio-data:/data \
  minio/minio server /data --console-address ":9090"
```

Then configure the alias and bucket:

```bash
mc alias set local https://localhost:9000 minioadmin minioadmin
mc mb local/novel-chapters-test
mc policy set public local/novel-chapters-test
```

Update `.env` with the `MINIO_*` values shown in the example file and restart the backend.

## How the backend uses storage

- `POST /api/novels/:novelId/chapters` accepts either a document upload (`file` field) or manual text (`content` field). The backend converts everything to HTML, uploads both the raw file and HTML rendering to storage, and stores their metadata (`rawFile`, `htmlFile`) on the `Chapter` document.
- Unlocked chapters expose the public URLs directly.
- Locked chapters require `POST /api/chapters/:chapterId/purchase` (10 xu). Readers call `GET /api/chapters/:chapterId/access` afterwards to receive short-lived presigned URLs (15 minutes by default).
- `backend/scripts/migrateChaptersToR2.js` uploads legacy inline content to storage in batches. Run it after deploying the new code.

## What to provide when asking for help

- R2 endpoint and bucket names (or MinIO endpoint for dev testing).
- Access key/secret for a test bucket (never production secrets in plain chat; use a secure channel or local `.env`).
- Confirmation that the CORS JSON above is applied.
- Desired cache TTL (currently set to 1 hour via `Cache-Control: public, max-age=3600`).

Once these are set, I can run `npm install`, execute tests, and (optionally) run the migration script end-to-end on your environment.
