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

const { getS3object, putS3object }  = require('./s3')
const { split } = require('sentence-splitter')
const BATCH_SIZE = 10

// The standard Lambda handler

exports.handler = async (event) => {

  // Check the output bucket exists
  if (!process.env.OutputBucket)
    return console.log('Error: process.env.OutputBucket not defined')

  // Handle each incoming S3 object in the event
  await Promise.all(
    event.Records.map(async (event) => {
      try {
        await doBatching(event)
      } catch (err) {
        console.error('Handler error: ', err)
      }
    })
  )

  return { statusCode: 200 }
}

// Split text file into chunks of 10 sentences and write to the
// destination bucket

const doBatching = async (event) => {

  let batches = []
  // const file = await fs.readFile('./war-and-peace.txt', 'utf8')

  const originalText = await getS3object({
    Bucket: event.s3.bucket.name,
    Key: event.s3.object.key
  })

  // Split into chunks
  const blocks = split(originalText.Body.toString('utf-8'))

  // Filter only sentences
  const sentences = blocks.filter (block => block.type === "Sentence")

  // Return the raw content
  const strings = sentences.map (sentence => sentence.raw)

  // Package into batches of 10 sentences
  while (strings.length > 0) {
    batches.push(strings.splice(0, BATCH_SIZE))
  }

  // Output chunks to S3 output bucket
  let counter = 0
  await Promise.all(
    batches.map(async (batch) => {
      counter++
      console.log(counter, batch.join(' '))

      const newKey = event.s3.object.key.replace('.txt', `-${counter}.txt`)
      const result = await putS3object({
        Bucket: process.env.OutputBucket,
        Key: newKey,
        Body: batch.join(' '),
        ContentType: 'text/plain'
      })

      console.log('S3 result: ', result)
    })
  )
}
