MinIO test setup and required information

This file explains how to run a local MinIO for testing and what information you must provide so I can run end-to-end tests and upload chapters.

Quick start (Docker):

1. Run MinIO server (example):

```bash
docker run -p 9000:9000 --name minio -e MINIO_ROOT_USER=minioadmin -e MINIO_ROOT_PASSWORD=minioadmin -v ${PWD}/minio-data:/data -d minio/minio server /data
```

2. Install `mc` (MinIO client) or use web UI at https://localhost:9000 with the above credentials.

3. Create bucket and set public-read policy (example using `mc`):

```bash
mc alias set local https://localhost:9000 minioadmin minioadmin
mc mb local/novel-chapters-test
# make public read (for non-locked chapters)
mc policy set public local/novel-chapters-test
```

CORS example (matches project requirement):

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

What I added to the repo


What you must provide (for me to run end-to-end):


Environment variables I will read (you can put these in `backend/.env`):


How I'll use MinIO in the project


Testing uploads manually

You can test uploads with `curl` (replace placeholders):

```bash
curl -X PUT "${MINIO_ENDPOINT}/${MINIO_BUCKET}/test.txt" -T sample/sample1.txt -u ${MINIO_ACCESS_KEY}:${MINIO_SECRET_KEY}
```

Or using AWS SDK in Node, or `mc` client as shown above.

Next steps for me once you provide the values


If you want, paste the values here (or add to `backend/.env`) and I will start implementing and running tests against MinIO.
