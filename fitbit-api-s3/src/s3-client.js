import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const s3 = new S3Client({
  region: 'ap-northeast-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

export async function uploadSleepLog(data) {
  const date = new Date().toISOString().slice(0, 10);
  const filePath = `sleep_${date}.json`;
  const s3Key    = `logs/${filePath}`;

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

  const command = new PutObjectCommand({
    Bucket: 'fitbitbucket-882',
    Key:    s3Key,
    Body:   fs.readFileSync(filePath),
    ContentType: 'application/json'
  });

  try {
    await s3.send(command);
    console.log('S3 업로드 성공:', s3Key);
  } catch (err) {
    console.error('S3 업로드 실패', err);
  }
}