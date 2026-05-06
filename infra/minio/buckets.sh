#!/bin/sh
# Noetia — MinIO bucket initialization
# Creates required buckets and folder structure with correct access policies.
# Idempotent: safe to run multiple times.
#
# Folder layout:
#   books/
#     covers/                    ← book cover images (public read)
#     {authorId}/
#       {bookId}/
#         text.pdf               ← book text (private)
#   audio/
#     {authorId}/
#       {bookId}/
#         full.mp3               ← full audio (private, streamed via signed URLs)
#   images/
#     share/                     ← generated share quote cards
#     backgrounds/
#       presets/                 ← 5 preset background images (imagen-1..5)
#       user/{userId}/           ← user-uploaded custom backgrounds

set -e

MINIO_ALIAS="local"
MINIO_URL="${MINIO_URL:-http://storage:9000}"
MINIO_ACCESS_KEY="${MINIO_ACCESS_KEY:-minioadmin}"
MINIO_SECRET_KEY="${MINIO_SECRET_KEY:-changeme}"

echo "Configuring MinIO alias..."
mc alias set "$MINIO_ALIAS" "$MINIO_URL" "$MINIO_ACCESS_KEY" "$MINIO_SECRET_KEY"

echo "Creating buckets..."
mc mb --ignore-existing "$MINIO_ALIAS/books"
mc mb --ignore-existing "$MINIO_ALIAS/audio"
mc mb --ignore-existing "$MINIO_ALIAS/images"

echo "Setting access policies..."
mc anonymous set none "$MINIO_ALIAS/books"
mc anonymous set none "$MINIO_ALIAS/audio"
mc anonymous set download "$MINIO_ALIAS/images"

echo "Creating folder structure (placeholder objects)..."
# books/covers/ — public-read subfolder placeholder
printf '' | mc pipe "$MINIO_ALIAS/books/covers/.keep"

# images/share/
printf '' | mc pipe "$MINIO_ALIAS/images/share/.keep"

# images/backgrounds/presets/
printf '' | mc pipe "$MINIO_ALIAS/images/backgrounds/presets/.keep"

# images/backgrounds/user/
printf '' | mc pipe "$MINIO_ALIAS/images/backgrounds/user/.keep"

echo "Buckets initialized:"
mc ls "$MINIO_ALIAS"
