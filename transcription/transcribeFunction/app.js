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
const transcribeService = new AWS.TranscribeService()
const s3 = new AWS.S3()

// Language list: en-US | es-US | en-AU | fr-CA | en-GB | de-DE | pt-BR | fr-FR | it-IT | ko-KR | es-ES | en-IN | hi-IN | ar-SA | ru-RU | zh-CN | nl-NL | id-ID | ta-IN | fa-IR | en-IE | en-AB | en-WL | pt-PT | te-IN | tr-TR | de-CH | he-IL | ms-MY | ja-JP | ar-AE
// See https://docs.aws.amazon.com/transcribe/latest/dg/API_StartTranscriptionJob.html for the most up-to-date list of languages available.
const DefaultLanguageCode = 'en-US'
const MediaFormat = 'mp3'

exports.handler = async (event) => {
  console.log (JSON.stringify(event, null, 2))

  try {
    await Promise.all(
      event.Records.map(async (record) => {
        const mediaUrl = `https://s3.amazonaws.com/${record.s3.bucket.name}/${record.s3.object.key}`
        const TranscriptionJobName = `${record.s3.object.key}-${Date.now()}`
    
        console.log(`S3 object: ${mediaUrl}`)
        console.log(`Job name: ${TranscriptionJobName}`)

        // Get object metadata if available
        const data = await s3.headObject({
          Bucket: record.s3.bucket.name,
          Key: record.s3.object.key,
        }).promise();

        // Use ContentLanguage for language code if present
        console.log(`Object data: ${JSON.stringify(data, null, 0)}`)
        let LanguageCode = data.hasOwnProperty('ContentLanguage') ? data.ContentLanguage : DefaultLanguageCode
        console.log(`LanguageCode: ${LanguageCode}`)

        // Submit job to Transcribe service
        const result =  await transcribeService.startTranscriptionJob({
          LanguageCode,
          Media: { MediaFileUri: mediaUrl },
          MediaFormat,
          TranscriptionJobName,
          OutputBucketName: record.s3.bucket.name
        }).promise()
        console.log(`Transcribe result: ${JSON.stringify(result, null, 0)}`)
      })
    )
  } catch (err) {
    console.error(err)
  }
}