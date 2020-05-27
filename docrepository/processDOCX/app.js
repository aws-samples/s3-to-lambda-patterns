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
const mammoth = require('mammoth')

// Invoked when a DOCX is put into the source
// bucket. Extracts text content and saves into
// staging bucket (OutputBucket).

// The standard Lambda handler
exports.handler = async (event) => {

  console.log(JSON.stringify(event, null, 2))

  // Handle each incoming S3 object in the event
  await Promise.all(
   event.Records.map(async (event) => {
     try {
       await processDocument(event)
     } catch (err) {
       console.error(`Handler error: ${err}`)
     }
   })
  )
}

const processDocument = async (event) => {

  // Get object info
  const Bucket = event.s3.bucket.name
  const Key = decodeURIComponent(event.s3.object.key.replace(/\+/g, ' '))
    
  console.log(`Bucket: ${Bucket}, Key: ${Key}`)

  // Get content from source S3 object
  const result = await s3.getObject({
    Bucket,
    Key
  }).promise()

  console.log(result)
  try {
    // Extract text from DOCX
    const text = (await mammoth.extractRawText(result.Body)).value    

    // Splits sentences and removes empty lines
    const lines = text.split('\n').filter((line) => (line !== ''))
    // Merged back together as one string
    const cleanedText = lines.join(' ')
    console.log('DOCX text length: ', cleanedText.length)

    // Write result to staging S3 bucket
    console.log(await s3.putObject({
      Bucket: process.env.OutputBucket,
      Key: `docx/${Key}.txt`,
      Body: cleanedText,
      ContentType: 'application/text'
    }).promise())

  } catch (err) {
    console.error(`Handler error: ${err}`)
  }
}
