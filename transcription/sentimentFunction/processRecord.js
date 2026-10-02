/*
  Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
  Permission is hereby granted, free of charge, to any person obtaining a copy of this
  software and associated documentation files (the "Software"), to deal in the Software
  without restriction, including without limitation the rights to use, copy, modify,
  merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
  permit persons to whom the Software is furnished to do so.
  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
  INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
  PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
  HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
  OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
  SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

'use strict'

const { ComprehendClient, DetectSentimentCommand } = require('@aws-sdk/client-comprehend')
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3')
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb')
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb')
const comprehend = new ComprehendClient({ region: process.env.AWS_REGION })
const s3 = new S3Client({ region: process.env.AWS_REGION })
const documentClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION }))

const LanguageCode = 'en'

const processRecord = async (record) => {
  // S3 event keys are URL-encoded, with spaces as '+'
  const Key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '))

  // Load JSON object
  const response = await s3.send(new GetObjectCommand({
    Bucket: record.s3.bucket.name,
    Key
  }))

  // Extract the transcript
  const originalText = JSON.parse(await response.Body.transformToString('utf-8'))
  const Text = originalText.results.transcripts[0].transcript

  // Do sentiment analysis
  console.log('Transcript: ', Text)
  const sentiment = await comprehend.send(new DetectSentimentCommand({
    LanguageCode,
    Text
  }))
  console.log(`Sentiment result: ${sentiment.Sentiment}`)

  // Store in DynamoDB
  const params = {
    TableName: process.env.DDBtable,
    Item: {
      partitionKey: Key,
      transcript: Text, 
      created: Math.floor(Date.now() / 1000),
      Sentiment: sentiment.Sentiment,
      Positive: sentiment.SentimentScore.Positive,
      Negative: sentiment.SentimentScore.Negative,
      Neutral: sentiment.SentimentScore.Neutral,
      Mixed: sentiment.SentimentScore.Mixed          
    }
  }

  // Return promise to map in event handler
  return documentClient.send(new PutCommand(params))
}

module.exports = { processRecord }
