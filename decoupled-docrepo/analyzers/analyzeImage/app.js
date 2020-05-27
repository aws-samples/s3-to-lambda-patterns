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
const rekognition = new AWS.Rekognition({apiVersion: '2016-06-27'})
const { putEvent } = require('./eventbridge')

// JPG converter - sends image to Rekognition to detect
// content and send labels to EventBridge.

// The standard Lambda handler
exports.handler = async (event) => {
  console.log(JSON.stringify(event, null, 2))

  try {
    // Get labels for image
    event.detail.labels = await processImage(event)

    // Push to EventBridge
    event.source = 'docRepo.analyzers'
    event.DetailType = 'NewImage'
    await(putEvent(event))

  } catch (err) {
    console.error(`Handler error: ${err}`)
  }
}

const processImage = async (event) => {
  // Rekognition expected params
  const params = {
    Image: {
      S3Object: {
        Bucket: event.detail.bucket,
        Name: event.detail.key
      }
    }, 
    MaxLabels: process.env.MaxLabels, 
    MinConfidence: process.env.MinConfidence
  }
  console.log('Params: ', params)

  // Send image to Rekognition
  const data = await rekognition.detectLabels(params).promise()
  // Extract key output attributes
  const labels = data.Labels.map((label) => ({Name: label.Name, Confidence: label.Confidence}))
  console.log('Rekognition labels: ', labels)

  return labels
}
