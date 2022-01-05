/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: MIT-0
 */

'use strict'

// Mock event
const event = require('./testEvent.json')

// Mock environment variables
process.env.AWS_REGION = 'eu-south-1'
process.env.localTest = true
process.env.SourceBucketName = 'video-converter-example-source'
process.env.OutputBucketName = 'video-converter-example-dest'

// Lambda handler
const { handler } = require('./app')

const main = async () => {
  console.time('localTest')
  console.dir(await handler(event))
  console.timeEnd('localTest')
}

main().catch(error => console.error(error))