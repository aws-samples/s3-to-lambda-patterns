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
const eventbridge = new AWS.EventBridge()

// Invoked when a S3 event occurs.

// The standard Lambda handler
exports.handler = async (event) => {
  console.log(JSON.stringify(event, null, 2))

  // Incoming key is URL encoded
  const key = decodeURIComponent(event.detail.requestParameters.key.replace(/\+/g, ' '))

  // Prepare outgoing event
  const params = {
    Entries: [{
      Source: 'docRepo.s3',
      DetailType: 'PutObject',
      EventBusName: 'default',
      Detail: JSON.stringify({
        bucket: event.detail.requestParameters.bucketName,
        key,
        type: key.split('.')[1]
      })
    }]
  }

  try {
    const result = await eventbridge.putEvents(params).promise()
    console.log(result)
  } catch (err) {
    console.error(`Handler error: ${err}`)
  }
}

