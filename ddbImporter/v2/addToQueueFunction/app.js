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

const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3')
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs')
const s3 = new S3Client({})

const { v4: uuidv4 } = require('uuid')
const sqs = new SQSClient({})

// The Lambda handler
exports.handler = async (event) => {
  console.log (JSON.stringify(event, null, 2))

  await Promise.all(
    event.Records.map(async (record) => {
      try {
        console.log('Incoming record: ', record)

        // Get original text from object in incoming event
        const originalText = await s3.send(new GetObjectCommand({
          Bucket: record.s3.bucket.name,
          Key: record.s3.object.key
        }))

        // Upload JSON to DynamoDB
        const jsonData = JSON.parse(await originalText.Body.transformToString('utf-8'))
        await addToSQS(jsonData)

      } catch (err) {
        console.error(err)
      }
    })
  )
}

// Add items to addToSQS
const addToSQS = async (data) => {
  // Separate into batches for upload
  let batches = []
  const BATCH_SIZE = 25

  while (data.length > 0) {
    batches.push(data.splice(0, BATCH_SIZE))
  }

  console.log(`Total batches: ${batches.length}`)

  let batchCount = 0

  // Save each batch
  await Promise.all(
    batches.map(async (item_data) => {

      const items = []
  
      item_data.forEach(item => {
        for (let key of Object.keys(item)) {
          // An AttributeValue may not contain an empty string
          if (item[key] === '') 
            delete item[key]
        }

        // Build params
        items.push({
          ID: uuidv4(),
          ...item
        })
      })

      // Params object for SQS
      const params = {
        MessageBody: JSON.stringify(items),
        QueueUrl: process.env.SQSqueueName
      }
      
      // Push to SQS in batches
      try {
        batchCount++
        console.log('Trying batch: ', batchCount)
        const result = await sqs.send(new SendMessageCommand(params))
        console.log('Success: ', result)
      } catch (err) {
        console.error('Error: ', err)
      }
    })
  )
}
