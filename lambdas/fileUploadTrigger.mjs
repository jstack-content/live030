import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb';

const dynamoClient = new DynamoDBClient();

export async function handler(event) {
  console.log(JSON.stringify(event, null, 2));

  const commands = event.Records.map(record => {
    return new UpdateItemCommand({
      TableName: 'upaki',
      Key: {
        fileKey: {
          S: decodeURIComponent(record.s3.object.key),
        },
      },
      UpdateExpression: 'SET #status = :status REMOVE #expiresAt',
      ExpressionAttributeNames: {
        '#status': 'status',
        '#expiresAt': 'expiresAt',
      },
      ExpressionAttributeValues: {
        ':status': { S: 'UPLOADED' }
      },
    });
  });

  await Promise.all(commands.map(command => dynamoClient.send(command)));
}
