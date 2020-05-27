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

// Language list: [en-IE, ar-AE, te-IN, en-US, en-AB, ta-IN, en-IN, ar-SA, zh-CN, gd-GB, tr-TR, id-ID, nl-NL, es-ES, pt-PT, ru-RU, it-IT, fr-FR, de-DE, ga-IE, af-ZA, ko-KR, de-CH, hi-IN, cy-GB, ms-MY, he-IL, da-DK, en-AU, en-WL, pt-BR, fa-IR, ja-JP, es-US, en-GB, fr-CA]
const LanguageCode = 'en-US'

exports.handler = async (event) => {
  const records = event.Records
  console.log (JSON.stringify(event, null, 2))

  try {
    await Promise.all(
      records.map((record) => {
        const mediaUrl = `https://s3.amazonaws.com/${record.s3.bucket.name}/${record.s3.object.key}`
        const TranscriptionJobName = `${record.s3.object.key}-${Date.now()}`
    
        console.log('S3 object: ', mediaUrl)
        console.log('Job name: ', TranscriptionJobName)

        return transcribeService.startTranscriptionJob({
          LanguageCode,
          Media: { MediaFileUri: mediaUrl },
          MediaFormat: 'mp3',
          TranscriptionJobName,
          OutputBucketName: record.s3.bucket.name,
        }).promise()
      })
    )
  } catch (err) {
    console.error(err)
  }
}