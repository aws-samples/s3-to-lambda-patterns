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

const checkRequiredLabels = async (event) => {

  let required = process.env.requiredLabels.split(',')
  let found = []

  const params = {
    Image: {
      S3Object: {
        Bucket: event.bucket, 
        Name: event.key
      }
    }, 
    MaxLabels: 5, 
    MinConfidence: (process.env.minConfidence || 70)
  }

  console.log(params)

  const data = await rekognition.detectLabels(params).promise()
  const { Labels } = data

  console.log('Labels found: ', Labels)

  // Find requiredWords in detected text
  Labels.forEach((item) => {
    if (required.includes(item.Name)) {
      found.push(item.Name)
    }
  })
  
  console.log('Required labels: ', required)
  console.log('Found labels: ', found)
  console.log('RequiredLabels result: ', (required.length <= found.length))
  
  // If foundWords match requiredWords, match is successful
  return (required.length <= found.length) ? true : false
}

const checkRequiredWords = async (event) => {

  let required = process.env.requiredWords.split(',')
  let found = []

  const params = {
    Image: {
      S3Object: {
        Bucket: event.bucket, 
        Name: event.key
      }
    },
    Filters: {
      WordFilter: {
        MinConfidence: (process.env.minConfidence || 70)
      }
    }
  }

  console.log(params)
  const data = await rekognition.detectText(params).promise()
  const { TextDetections } = data

  console.log('Words found: ', TextDetections)
  
  // Find requiredWords in detected text
  TextDetections.forEach((item) => {
    if (required.includes(item.DetectedText)) {
      found.push(item.DetectedText)
    }
  })
  
  console.log('Required words: ', required)
  console.log('Found words: ', found)
  console.log('RequiredWords result: ', (required.length <= found.length))
  
  // If foundWords match requiredWords, match is successful
  return (required.length <= found.length) ? true : false
}

module.exports = {
  checkRequiredLabels,
  checkRequiredWords
}