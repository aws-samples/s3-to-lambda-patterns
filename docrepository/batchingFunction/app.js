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

const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3')
const s3 = new S3Client({ region: process.env.AWS_REGION })

// Split text into sentences using the built-in Intl.Segmenter, treating newlines as boundaries
const segmenter = new Intl.Segmenter('en', { granularity: 'sentence' })
const splitSentences = (text) => text.split(/\n+/).flatMap(line =>
  Array.from(segmenter.segment(line), ({ segment }) => segment.trim())
).filter(Boolean)
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
  const result = await s3.send(new GetObjectCommand({
    Bucket,
    Key
  }))
  
  console.log(`Downloaded object from S3`)
  const text = await result.Body.transformToString('utf-8')
  console.log(`Original text length: ${text.length}`)

  const sentences = splitSentences(text)

  console.log(`Total sentences: ${sentences.length}`)

  // Package into batches of sentences <MAX_CHARS total
  // (always take at least one sentence so the loop progresses)
  while (sentences.length > 0) {
    const batchSize = Math.max(findMaxBatchSize(sentences), 1)
    batches.push(sentences.splice(0, batchSize))
  }

  console.log(`Total batches: ${batches.length}`)

  // Output chunks to S3 output bucket
  let counter = 0
  await Promise.all(
    batches.map(async (batch) => {
      counter++
      console.log(counter, batch.join(sentenceDelimeter))

      const newKey = Key.replace(/\.txt$/, `-${counter}.txt`)
      await s3.send(new PutObjectCommand({
        Bucket: process.env.OutputBucket,
        Key: newKey,
        Body: batch.join(' '),
        ContentType: 'text/plain'
      }))

      console.log('Saved to S3: ', newKey)
    })
  )
}

// Takes arrays of text and returns the number of sentences
// that fit before the total length reaches MAX_CHARS.
const findMaxBatchSize = (sentences) => {
  let currTotalChar = 0

  for (let i = 0; i < sentences.length; i++) {
    currTotalChar += sentences[i].length + sentenceDelimeter.length
    if (currTotalChar >= MAX_CHARS) return i
  }

  // All remaining sentences fit
  return sentences.length
}