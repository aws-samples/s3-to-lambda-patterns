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

const AWS = require('aws-sdk')
AWS.config.region = process.env.AWS_REGION
const comprehend = new AWS.Comprehend()
const s3 = new AWS.S3()
const documentClient = new AWS.DynamoDB.DocumentClient()

const LanguageCode = 'en'

const processRecord = async (record) => {
  // Load JSON object
  const response = await s3.getObject({
    Bucket: record.s3.bucket.name,
    Key: record.s3.object.key
  }).promise()

  // Extract the transcript
  const originalText = JSON.parse(response.Body.toString('utf-8'))
  const Text = originalText.results.transcripts[0].transcript

  // Do sentiment analysis
  console.log('Transcript: ', Text)
  const sentiment = await comprehend.detectSentiment({
    LanguageCode,
    Text
  }).promise()
  console.log(`Sentiment result ${sentiment}`)

  // Store in DynamoDB
  const params = {
    TableName: process.env.DDBtable,
    Item: {
      partitionKey: record.s3.object.key,
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
  return documentClient.put(params).promise()
}

module.exports = { processRecord }
