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

const TableName = process.env.DDBtable
const docClient = new AWS.DynamoDB.DocumentClient()

const { translateText } = require('./translate')

// The standard Lambda handler
exports.handler = async (event) => {
  console.log (JSON.stringify(event, null, 2))

  await Promise.all(
    event.Records.map(async (record) => {
      try {
        const message = JSON.parse(record.body)
        await doTranslation(message)
        await saveToDDB(message, 'Translated')
      } catch (err) {
        console.error(`Handler error: ${err}`)
      }
    })
  )
}

// Translate and save output to S3
const doTranslation = async (message) => {
  console.log(`doTranslation: ${JSON.stringify(message)}`)
  return new Promise(async (resolve, reject) => {
      
    // Get original text from object in incoming event
    const originalText = await s3.getObject({
      Bucket: message.Bucket,
      Key: message.Key
    }).promise()
 
    // Translate the text
    const data = await translateText(originalText.Body.toString('utf-8'), message.Language)

    // Save the new translation
    const baseObjectName = message.Key.replace('.txt','')
    await s3.putObject({
      Bucket: process.env.OutputBucket,
      Key: `${baseObjectName}-${message.Language}.txt`,
      Body: data.TranslatedText,
      ContentType: 'text/plain'
    }).promise()
    resolve()
  })
}

// Save single item to DynamoDB
const saveToDDB = async (data, Status) => {
  try {
    await docClient.put({
      TableName,
      Item: {
        ID: `${data.Bucket}/${data.Key}`,
        Language: `${data.Language}`,
        Status
      }
    }).promise()
  } catch (err) {
    console.error(`Error: ${err}`)
  }
}