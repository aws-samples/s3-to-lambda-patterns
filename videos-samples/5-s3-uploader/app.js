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


// This is the function you will need in your Lambda to make the backend work.
// Follow along in the tutorial to see how to set this up.

const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner')
const s3 = new S3Client({ region: process.env.REGION });

const uploadBucket = '<< ENTER YOUR BUCKET NAME HERE >>'   // << LOOK!

exports.handler = async (event) => {
  const result = await getUploadURL()
  console.log('Result: ', result)
  return result
};

const getUploadURL = async function() {
  console.log('getUploadURL started')
  let actionId = Date.now()

  var s3Params = {
    Bucket: uploadBucket,
    Key:  `${actionId}.jpg`,
    ContentType: 'image/jpeg',
//    CacheControl: 'max-age=31104000',
//    ACL: 'public-read',   // Optional if you want the object to be publicly readable
  };

  // Get signed URL (expires in 900 seconds, the same default as SDK v2)
  let uploadURL = await getSignedUrl(s3, new PutObjectCommand(s3Params), { expiresIn: 900 })
  return {
    "statusCode": 200,
    "isBase64Encoded": false,
    "headers": {
      "Access-Control-Allow-Origin": "*"
    },
    "body": JSON.stringify({
        "uploadURL": uploadURL,
        "photoFilename": `${actionId}.jpg`
    })
  }
}
