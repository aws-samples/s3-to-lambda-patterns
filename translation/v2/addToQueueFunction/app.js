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

const { arrayContainsArray } = require('./array')

const AWS = require('aws-sdk')
AWS.config.region = process.env.AWS_REGION 
const s3 = new AWS.S3()
const sqs = new AWS.SQS({apiVersion: '2012-11-05'})

const TableName = process.env.DDBtable
const docClient = new AWS.DynamoDB.DocumentClient()

let messages = []

// Entire list of language codes at: https://docs.aws.amazon.com/translate/latest/dg/how-it-works.html#how-it-works-language-codes
const supportedLanguages = ['ar','zh','zh-TW','cs','da','nl','en','fi','fr','de','he','hi','id','it','ja','ko','ms','no','fa','pl','pt','ru','es','sv','tr']
const targetLanguages = process.env.targetLanguage.split(' ')

// The Lambda handler
exports.handler = async (event) => {
  console.log (JSON.stringify(event, null, 2))

  // Check incoming language list matches supported languages
  if (arrayContainsArray(supportedLanguages, targetLanguages) === false) {
    return console.error(`Aborting: targetLanguages includes language codes not in supported list (${supportedLanguages})`)
  }

  // Iterate through incoming records and language list
  event.Records.map((record) => {
    targetLanguages.map((targetLanguage) => {
      messages.push({
        Bucket: record.s3.bucket.name,
        Key: record.s3.object.key,
        Language: targetLanguage
      })
    })
  })

  console.log(`Messages for SQS: ${JSON.stringify(messages, null, 2)}`)

  // Send array of messages to SQS
  try {
    await addToSQS(messages)
  } catch (err) {
    console.error(err)
  }
}

// Add items to addToSQS
const addToSQS = async (messages) => {
  // Separate into batches for upload
  let batches = []
  const BATCH_SIZE = 10

  while (messages.length > 0) {
    batches.push(messages.splice(0, BATCH_SIZE))
  }

  console.log(`Total batches: ${batches.length}`)
  let batchCount = 0

  // Save each batch
  await Promise.all(
    batches.map(async (item_data) => {

      const items = []
  
      item_data.forEach(async item => {
        items.push({
          Id: `${Date.now()}-${parseInt(Math.random()*100000)}`,
          MessageBody: JSON.stringify(item)
        })
        await saveToDDB(item)
      })

      // Params object for SQS
      const params = {
        Entries: items,
        QueueUrl: process.env.SQSqueueName
      }
      
      console.log(JSON.stringify(params, null, 2))

      // Push to SQS in batches
      try {
        batchCount++
        console.log(`Trying batch: ${batchCount}`)
        const result = await sqs.sendMessageBatch(params).promise()
        console.log(`Success: ${result}`)
      } catch (err) {
        console.error(`Error: ${err}`)
      }
    })
  )
}

// Save to DynamoDB
const saveToDDB = async (data) => {
  try {
    await docClient.put({
      TableName,
      Item: {
        ID: `${data.Bucket}/${data.Key}`,
        Language: `${data.Language}`,
        Status: "Queued"
      }
    }).promise()
  } catch (err) {
    console.error(`Error: ${err}`)
  }
}