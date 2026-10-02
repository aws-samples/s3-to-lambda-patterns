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

const { S3Client, GetObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3")
const s3 = new S3Client({ region: ( process.env.AWS_REGION || 'us-east-1' ) })

// Returns object from S3

// let params = {
//   Bucket: record.s3.bucket.name,
//   Key: record.s3.object.key
// }

async function getS3object(params) {
  try {
    const data = await s3.send(new GetObjectCommand(params))
    // Buffer the streamed Body so callers can use Body.toString()
    data.Body = Buffer.from(await data.Body.transformToByteArray())
    return data
  } catch (err) {
    console.error('getS3object error: ', err, err.stack) // an error occurred
    throw err
  }
}

// Puts object to S3 //

// e.g. params = {
//   Bucket: record.s3.bucket.name,
//   Key: record.s3.object.key
//   Body: data,
//   ContentType: res.headers['content-type'],   
//   CacheControl: 'max-age=31536000',
//   ACL: 'public-read',
//   StorageClass: 'STANDARD'
// }

async function putS3object(params) {
  console.log('putS3object: ', params.Bucket, params.Key)
  try {
    return await s3.send(new PutObjectCommand(params))
  } catch (err) {
    console.log('putS3object error: ', err, err.stack) // an error occurred
    throw err
  }
}

module.exports = {
  getS3object,
  putS3object
}
