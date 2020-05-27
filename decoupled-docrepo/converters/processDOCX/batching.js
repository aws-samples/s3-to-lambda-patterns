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

const tokenizer = require('sbd')
const sentenceDelimeter = ' '

// 5000 chars is the limit. Allowing for extra spaces when sentences are merged.
const MAX_CHARS = 4800

// Split text file into chunks of MAX_CHARS, respecting entire
// sentences, and write to the destination bucket. 

const doBatching = async (text) => {
  let batches = []

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
    const batch = sentences.splice(0, nextIndex)
    batches.push({
      text: batch.join(' '),
      length: batch.join(' ').length
    })
  }

  console.log(`Total batches: ${batches.length}`)
  return batches
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

module.exports = { doBatching }