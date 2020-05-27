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

const tokenizer = require('sbd')
const sentenceDelimeter = ' '

// 5000 chars is the limit. Allowing for extra spaces when sentences are merged.
const MAX_CHARS = 4800

// The Lambda handler
exports.handler = async (event) => {
  console.log (JSON.stringify(event, null, 2))

  // Check the output bucket exists
  if (!process.env.OutputBucket)
    return console.log('Error: process.env.OutputBucket not defined')

  // Handle each incoming S3 object in the event
  await Promise.all(
    event.Records.map(async (event) => {
      try {
        await doBatching(event)
      } catch (err) {
        console.error(`Handler error: ${err}`)
      }
    })
  )
}

// Split text file into chunks of 10 sentences and write to the
// destination bucket

const doBatching = async (event) => {
  let batches = []

  // Get object info
  const Bucket = event.s3.bucket.name
  const Key = decodeURIComponent(event.s3.object.key.replace(/\+/g, ' '))
    
  console.log(`Bucket: ${Bucket}, Key: ${Key}`)

  // Get content from source S3 object
  const result = await s3.getObject({
    Bucket,
    Key
  }).promise()
  
  console.log(`Downloaded object from S3`)
  const text = result.Body.toString('utf-8')
  console.log(`Original text length: ${text.length}`)

  const sentences = tokenizer.sentences(text, {
    "newline_boundaries": true,
    "sanitize": false,
  })

  console.log(`Total sentences: ${sentences.length}`)

  // // Package into batches of sentences <MAX_CHARS total
  while (sentences.length > 0) {
    const nextIndex = findMaxBatchSize(sentences)
    if (nextIndex === -1) break
    // console.log(sentences.length, nextIndex)
    batches.push(sentences.splice(0, nextIndex))
  }

  console.log(`Total batches: ${batches.length}`)

  // Output chunks to S3 output bucket
  let counter = 0
  await Promise.all(
    batches.map(async (batch) => {
      counter++
      console.log(counter, batch.join(sentenceDelimeter))

      const newKey = Key.replace('.txt', `-${counter}.txt`)
      const result = await s3.putObject({
        Bucket: process.env.OutputBucket,
        Key: newKey,
        Body: batch.join(' '),
        ContentType: 'text/plain'
      }).promise()

      console.log('S3 result: ', result)
    })
  )
}

// Takes arrays of text and returns the index before
// the total length exceeds MAX_CHARS.
const findMaxBatchSize = (sentences) => {

  // Defaults position to end of array
  // for when the total size is < MAX
  let pos = sentences.length + 1
  let currTotalChar = 0

  for (let i = 0; i < sentences.length; i++) {
    currTotalChar += sentences[i].length + sentenceDelimeter.length
    if (currTotalChar >= MAX_CHARS) {
      pos = i
      break
    }
  }

  // console.log(`Index: ${pos}. Total chars: ${currTotalChar}`)
  return pos - 1
}