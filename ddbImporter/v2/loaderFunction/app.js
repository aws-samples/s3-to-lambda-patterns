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

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb')
const { DynamoDBDocumentClient, BatchWriteCommand } = require('@aws-sdk/lib-dynamodb')

const ddbTable = process.env.DDBtable 
const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({}))
let batchCount 

// The Lambda handler
exports.handler = async (event) => {
    
  // Only count for this invocation, not all warm invocations
  batchCount = 0
    
  await Promise.all(
    event.Records.map(async (event) => {
      const items = JSON.parse(event.body)
      console.log(JSON.stringify(items, null, 2))
      await saveToDDB(items)
    })
  )
}

// BatchWrite can return UnprocessedItems (for example when throttled) without
// throwing, so resubmit them with exponential backoff
const MAX_ATTEMPTS = 5
const batchWriteWithRetry = async (params) => {
  let RequestItems = params.RequestItems
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const result = await docClient.send(new BatchWriteCommand({ RequestItems }))
    if (!result.UnprocessedItems || Object.keys(result.UnprocessedItems).length === 0) return
    RequestItems = result.UnprocessedItems
    console.log(`Retrying ${RequestItems[ddbTable].length} unprocessed items (attempt ${attempt})`)
    await new Promise((resolve) => setTimeout(resolve, 100 * 2 ** attempt))
  }
  throw new Error(`Items still unprocessed after ${MAX_ATTEMPTS} attempts`)
}

const saveToDDB = async (item_data) => {

  // Set up the params object for the DDB call
  const params = {
    RequestItems: {}
  }
  params.RequestItems[ddbTable] = []

  item_data.forEach(item => {
    for (let key of Object.keys(item)) {
      // An AttributeValue may not contain an empty string
      if (item[key] === '') 
        delete item[key]
    }

    // Build params
    params.RequestItems[ddbTable].push({
      PutRequest: {
        Item: {
          ...item
        }
      }
    })
  })

  console.log(`saveToDDB params: ${JSON.stringify(params, null, 2)}`)

  // Push to DynamoDB in batches
  try {
    batchCount++
    console.log('Trying batch: ', batchCount)
    await batchWriteWithRetry(params)
    console.log('Success: batch', batchCount)
  } catch (err) {
    console.error('Error: ', err)
    // Rethrow so SQS redelivers the message instead of deleting it
    throw err
  }
}