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

const { TranscribeClient, StartTranscriptionJobCommand } = require('@aws-sdk/client-transcribe')
const { S3Client, HeadObjectCommand } = require('@aws-sdk/client-s3')
const transcribeService = new TranscribeClient({ region: process.env.AWS_REGION })
const s3 = new S3Client({ region: process.env.AWS_REGION })

// Language list: en-US | es-US | en-AU | fr-CA | en-GB | de-DE | pt-BR | fr-FR | it-IT | ko-KR | es-ES | en-IN | hi-IN | ar-SA | ru-RU | zh-CN | nl-NL | id-ID | ta-IN | fa-IR | en-IE | en-AB | en-WL | pt-PT | te-IN | tr-TR | de-CH | he-IL | ms-MY | ja-JP | ar-AE
// See https://docs.aws.amazon.com/transcribe/latest/dg/API_StartTranscriptionJob.html for the most up-to-date list of languages available.
const DefaultLanguageCode = 'en-US'
const MediaFormat = 'mp3'

// Job names must match ^[0-9a-zA-Z._-]+ and be no longer than 200 characters
const MAX_JOB_NAME_LENGTH = 200

// Builds a valid, unique job name from the object key
const getJobName = (key) => {
  const suffix = `-${Date.now()}`
  const baseName = key.replace(/[^0-9a-zA-Z._-]/g, '-').substring(0, MAX_JOB_NAME_LENGTH - suffix.length)
  return `${baseName}${suffix}`
}

exports.handler = async (event) => {
  console.log (JSON.stringify(event, null, 2))

  try {
    await Promise.all(
      event.Records.map(async (record) => {
        // S3 event keys are URL-encoded, with spaces as '+'
        const Key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '))
        const mediaUrl = `s3://${record.s3.bucket.name}/${Key}`
        const TranscriptionJobName = getJobName(Key)
    
        console.log(`S3 object: ${mediaUrl}`)
        console.log(`Job name: ${TranscriptionJobName}`)

        // Get object metadata if available
        const data = await s3.send(new HeadObjectCommand({
          Bucket: record.s3.bucket.name,
          Key,
        }));

        // Use ContentLanguage for language code if present
        console.log(`Object ContentLanguage: ${data.ContentLanguage}`)
        let LanguageCode = data.ContentLanguage ? data.ContentLanguage : DefaultLanguageCode
        console.log(`LanguageCode: ${LanguageCode}`)

        // Submit job to Transcribe service
        const result =  await transcribeService.send(new StartTranscriptionJobCommand({
          LanguageCode,
          Media: { MediaFileUri: mediaUrl },
          MediaFormat,
          TranscriptionJobName,
          OutputBucketName: record.s3.bucket.name
        }))
        console.log(`Transcribe job status: ${result.TranscriptionJob.TranscriptionJobStatus}`)
      })
    )
  } catch (err) {
    console.error(err)
  }
}