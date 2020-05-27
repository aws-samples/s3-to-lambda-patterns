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
const s3 = new AWS.S3()
const comprehend = new AWS.Comprehend({apiVersion: '2017-11-27'})

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
  const Key = decodeURIComponent(event.Key.replace(/\+/g, ' '))
  const Bucket = event.Bucket
  const type = Key.split('/')[0]
  console.log(`Bucket: ${Bucket}, Key: ${Key}, Type: ${type}`)

  // Payload object for ES
  let payload = {
    id: Date.now(),
    index: type,
    content: {
      Key,
      Bucket,
      entities: []
    }
  }

  // Load text from S3
  const s3obj = await s3.getObject({ Bucket, Key }).promise()
  const Text = s3obj.Body.toString('utf-8')

  // Processing different between images and PDF/DOCX
  if (type === "images") {
    // Load json from S3 object
    const labels = JSON.parse(Text)
    // Strip down entities to labels
    payload.content.entities = labels.map((label) => (label.Name))
  } else {
    // Get entities from Comprehend
    const result = await comprehend.detectEntities({
      LanguageCode: process.env.language,
      Text
    }).promise()
    // Strip down entities to labels
    payload.content.entities = result.Entities.map((entity) => (entity.Text))
  }

  // This is the payload for Elasticsearch
  console.log('Payload: ', JSON.stringify(payload, null, 2))
  await indexDocument(payload)
}
