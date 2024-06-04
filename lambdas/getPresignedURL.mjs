import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';

const s3Client = new S3Client();
const dynamoClient = new DynamoDBClient();

export async function handler(event) {
  const { fileName } = JSON.parse(event.body);

  if (!fileName) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: 'File name is required.',
      }),
    };
  }

  const fileKey = `${randomUUID()}-${fileName}`;

  const s3Command = new PutObjectCommand({
    Bucket: 'upaki',
    Key: fileKey,
  });

  const dynamoCommand = new PutItemCommand({
    TableName: 'upaki',
    Item: {
      fileKey: { S: fileKey },
      originalFileName: { S: fileName },
      status: { S: 'PENDING' },
      expiresAt: { N: (Date.now() + 60000).toString() },
    },
  });

  const signedUrl = await getSignedUrl(s3Client, s3Command, { expiresIn: 60 });

  await dynamoClient.send(dynamoCommand);

  return {
    statusCode: 200,
    body: JSON.stringify({ signedUrl }),
  };
}
