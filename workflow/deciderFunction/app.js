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
const { checkRequiredWords, checkRequiredLabels } = require ('./businessLogic.js')

/* Event format: 
{
    "bucket": "bucket-name",
    "key": "object-name"
}
*/

// The standard Lambda handler
exports.handler = async (event) => {
  console.log(JSON.stringify(event, null, 2))
  return await processDocument(event)
}

// Detect words/labels on document or image
const processDocument = async (event) => {
  console.log(JSON.stringify(event, null, 2))

  // If using a required labels
  if (process.env.requiredLabels) {
    console.log('Required labels')
    // If it fails, return immediately
    if (!await checkRequiredLabels(event)) return 'NoMatch'
  }  

  // If using a required words test
  if (process.env.requiredWords) {
    console.log('Required words')
    // If it fails, return immediately
    if (!await checkRequiredWords(event)) return 'NoMatch'
  }

  return 'Match'
}
