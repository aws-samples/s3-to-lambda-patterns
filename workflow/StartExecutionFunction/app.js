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

const AWS = require('aws-sdk')
const stepFunctions = new AWS.StepFunctions({ region: process.env.AWS_REGION })

// The standard Lambda handler
exports.handler = async (event) => {

    console.log(JSON.stringify(event, null, 2))
    
    // Handle each record in the event
    await Promise.all(
      event.Records.map(async (event) => {
        try {
          await startExecution(event)
        } catch (err) {
          console.error(`Handler error: ${err}`)
        }
      })
    )
  }

const startExecution = async (event) => {
    console.log(event)
    const params = {
        stateMachineArn: process.env.stateMachineArn,
        name: Math.floor(Math.random() * Math.floor(1000000000)).toString(),
        input: JSON.stringify({
            bucket: event.s3.bucket.name,
            key: event.s3.object.key
        })
    }    
    console.log(params)
    const result = await stepFunctions.startExecution(params).promise()
    console.log(result)
}
