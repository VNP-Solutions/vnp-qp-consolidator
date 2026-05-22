const {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
} = require('@aws-sdk/client-s3');

let client;

function getClient() {
    if (client) return client;
    client = new S3Client({
        region: process.env.AWS_REGION,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
    });
    return client;
}

function buildS3Url(key) {
    const base = (process.env.S3_BUCKET_URL || '').replace(/\/+$/, '');
    return `${base}/${key}`;
}

async function uploadBufferToS3({ buffer, key, contentType }) {
    const bucket = process.env.AWS_S3_BUCKET;
    if (!bucket) throw new Error('AWS_S3_BUCKET is not set');

    await getClient().send(
        new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: buffer,
            ContentType: contentType,
        })
    );

    return { url: buildS3Url(key), key };
}

async function downloadBufferFromS3(key) {
    const bucket = process.env.AWS_S3_BUCKET;
    if (!bucket) throw new Error('AWS_S3_BUCKET is not set');

    const res = await getClient().send(
        new GetObjectCommand({ Bucket: bucket, Key: key })
    );

    const chunks = [];
    for await (const chunk of res.Body) {
        chunks.push(chunk);
    }
    return Buffer.concat(chunks);
}

async function deleteFromS3(key) {
    const bucket = process.env.AWS_S3_BUCKET;
    if (!bucket) throw new Error('AWS_S3_BUCKET is not set');

    await getClient().send(
        new DeleteObjectCommand({ Bucket: bucket, Key: key })
    );
}

module.exports = { uploadBufferToS3, downloadBufferFromS3, deleteFromS3, buildS3Url };