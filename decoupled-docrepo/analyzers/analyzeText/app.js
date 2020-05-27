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

const comprehend = new AWS.Comprehend({apiVersion: '2017-11-27'})
const { putEvent } = require('./eventbridge')

// Uses Comprehend to detect entities in text.

// The standard Lambda handler
exports.handler = async (event) => {
  console.log(JSON.stringify(event, null, 2))

  try {
    // Get entities from Comprehend
    event.detail.entities = await processText(event) 

    // Push to EventBridge
    event.source = 'docRepo.analyzers'
    event.DetailType = 'NewTextBatch'
    await(putEvent(event))

  } catch (err) {
    console.error(`Handler error: ${err}`)
  }
}

// Get entities for text
const processText = async (event) => {
  // Get entities from Comprehend
  const result = await comprehend.detectEntities({
    LanguageCode: process.env.language,
    Text: event.detail.text
  }).promise()

  // Strip down entities to labels
  return result.Entities.map((entity) => (entity.Text))
}
