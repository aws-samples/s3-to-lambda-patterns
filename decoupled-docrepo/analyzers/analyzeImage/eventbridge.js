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
const eventbridge = new AWS.EventBridge()

const MAX_EVENTS = 10

const putEvent = async (appEvent) => {

  const params = {
    Entries: [{
      Detail: JSON.stringify({
        ...appEvent.detail,
      }),
      DetailType: appEvent.DetailType,
      EventBusName: 'default',
      Source: appEvent.source,
      Time: new Date 
    }]
  }
  console.log('--- Params ---')
  console.log(params)
  const result = await eventbridge.putEvents(params).promise()
  console.log('--- Response ---')
  console.log(result)
}

const putEvents = async (appEvent) => {

  let batchNumber = 0

  // Convert format of array
  const allEntries = appEvent.batches.map((batch) => {
    batchNumber++
    return {
      Detail: JSON.stringify({
        ...appEvent.detail,
        text: batch.text,
        batchTotal: appEvent.batches.length,
        batchNumber
      }),
      DetailType: appEvent.DetailType,
      EventBusName: 'default',
      Source: appEvent.source,
      Time: new Date 
    }
  })

  // Send in batches of MAX_EVENTS to EventBridge
  while (allEntries.length > 0) {
    const params = {
      Entries: allEntries.splice(0, MAX_EVENTS),
    }
    console.log('--- Params ---')
    console.log(params)
    const result = await eventbridge.putEvents(params).promise()
    console.log('--- Response ---')
    console.log(result)
  }
}

module.exports = { 
  putEvent,
  putEvents
}
