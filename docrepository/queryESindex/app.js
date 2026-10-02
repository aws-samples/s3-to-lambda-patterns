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

const { SignatureV4 } = require('@smithy/signature-v4')
const { Sha256 } = require('@aws-crypto/sha256-js')
const { HttpRequest } = require('@smithy/protocol-http')
const { NodeHttpHandler } = require('@smithy/node-http-handler')
const { defaultProvider } = require('@aws-sdk/credential-provider-node')

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
  const request = new HttpRequest({
    method: 'GET',
    protocol: 'https:',
    hostname: process.env.domain,
    path: '/_search',
    query: { q: event.queryStringParameters.q },
    headers: {
      'host': process.env.domain,
      'Content-Type': 'application/json'
    }
  })

  const signer = new SignatureV4({
    credentials: defaultProvider(),
    region: process.env.AWS_REGION,
    service: 'es',
    sha256: Sha256
  })
  const signedRequest = await signer.sign(request)

  const client = new NodeHttpHandler()
  try {
    const { response } = await client.handle(signedRequest)
    console.log(response.statusCode + ' ' + response.reason)
    let responseBody = ''
    for await (const chunk of response.body) {
      responseBody += chunk
    }
    console.log('Response body: ' + responseBody)
    return responseBody
  } catch (error) {
    console.log('Error: ' + error)
    throw error
  }
}
