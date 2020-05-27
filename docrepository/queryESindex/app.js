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

// Invoked by API Gateway HTTP APIs.

// The standard Lambda handler
exports.handler = async (event) => {
  console.log(JSON.stringify(event, null, 2))

  if (!("q" in event.queryStringParameters)) {
    return {
      statusCode: 422,
      body: 'Missing parameter'
    }
  }

  // Run elasticsearch query  
  try {
    const response = await queryES(event)
    return {
      statusCode: 200,
      body: JSON.stringify(response)
    }
  } catch (err) {  
    console.error(err)
    return {
      statusCode: 500,
      body: JSON.stringify(err)
    }
  }
}

const queryES = async (event) => {
  return new Promise((resolve, reject) => {
    const endpoint = new AWS.Endpoint(process.env.domain)
    let request = new AWS.HttpRequest(endpoint, process.env.AWS_REGION)
    const document = event.content
  
    request.method = 'GET'
    request.path += '/_search?q=' + event.queryStringParameters.q
    request.headers['host'] = process.env.domain
    request.headers['Content-Type'] = 'application/json';

    const credentials = new AWS.EnvironmentCredentials()
    console.log(credentials)
    const signer = new AWS.Signers.V4(request, 'es')
    signer.addAuthorization(credentials, new Date())
  
    const client = new AWS.HttpClient()
    client.handleRequest(request, null, function(response) {
      console.log(response.statusCode + ' ' + response.statusMessage)
      let responseBody = ''
      response.on('data', function (chunk) {
        responseBody += chunk;
      });
      response.on('end', function (chunk) {
        console.log('Response body: ' + responseBody)
        resolve(responseBody)
      });
    }, function(error) {
      console.log('Error: ' + error)
      reject()
    })
  })
}
