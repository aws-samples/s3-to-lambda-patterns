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

const crypto = require('crypto')
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3')
const { ComprehendClient, DetectEntitiesCommand } = require('@aws-sdk/client-comprehend')
const s3 = new S3Client({ region: process.env.AWS_REGION })
const comprehend = new ComprehendClient({ region: process.env.AWS_REGION })

const { indexDocument } = require('./indexDocument')

// The Lambda handler
exports.handler = async (event) => {
  console.log (JSON.stringify(event, null, 2))

  // Handle each incoming S3 object in the event
  await Promise.all(
    event.Records.map(async (event) => {
      try {
        await processDocument(JSON.parse(event.body))
      } catch (err) {
        console.error(`Handler error: ${err}`)
      }
    })
  )
}

// Load text, run Comprehend, save to ES
const processDocument = async (event) => {

  console.log('indexDocument: ', event)
  // Key arrives URL-encoded from the S3 event via addToQueueFunction
  const Key = decodeURIComponent(event.Key.replace(/\+/g, ' '))
  const Bucket = event.Bucket
  const type = Key.split('/')[0]
  console.log(`Bucket: ${Bucket}, Key: ${Key}, Type: ${type}`)

  // Payload object for ES
  let payload = {
    // Deterministic ID, so reprocessing a file updates its existing document
    id: crypto.createHash('sha256').update(`${Bucket}/${Key}`).digest('hex'),
    index: type,
    content: {
      Key,
      Bucket,
      entities: []
    }
  }

  // Load text from S3
  const s3obj = await s3.send(new GetObjectCommand({ Bucket, Key }))
  const Text = await s3obj.Body.transformToString('utf-8')

  // Processing different between images and PDF/DOCX
  if (type === "images") {
    // Load json from S3 object
    const labels = JSON.parse(Text)
    // Strip down entities to labels
    payload.content.entities = labels.map((label) => (label.Name))
  } else {
    // Get entities from Comprehend
    const result = await comprehend.send(new DetectEntitiesCommand({
      LanguageCode: process.env.language,
      Text
    }))
    // Strip down entities to labels
    payload.content.entities = result.Entities.map((entity) => (entity.Text))
  }

  // This is the payload for Elasticsearch
  console.log('Payload: ', JSON.stringify(payload, null, 2))
  await indexDocument(payload)
}
