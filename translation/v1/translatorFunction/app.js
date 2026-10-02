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

const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3')
const s3 = new S3Client({ region: process.env.AWS_REGION })

const { translateText } = require('./translate')

// Entire list of language codes at: https://docs.aws.amazon.com/translate/latest/dg/how-it-works.html#how-it-works-language-codes
const supportedLanguages = ['ar','zh','zh-TW','cs','da','nl','en','fi','fr','de','he','hi','id','it','ja','ko','ms','no','fa','pl','pt','ru','es','sv','tr']
const targetLanguages = process.env.targetLanguage.split(' ')

// The standard Lambda handler
exports.handler = async (event) => {
  console.log (JSON.stringify(event, null, 2))

  // Check incoming language list matches supported languages
  if (arrayContainsArray(supportedLanguages, targetLanguages) === false) {
    return console.error(`Aborting: targetLanguages includes language codes not in supported list (${supportedLanguages})`)
  }

  // Handle each incoming S3 object in the event
  await Promise.all(
    event.Records.map(async (record) => {
      // S3 event keys are URL-encoded, with spaces as '+'
      const Bucket = record.s3.bucket.name
      const Key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '))

      // Don't fire for any new file in the translations folder
      if (Key.startsWith('translations/')) return

      await Promise.all(
        targetLanguages.map(async (targetLanguage) => {
          try {
            await doTranslation(Bucket, Key, targetLanguage)
          } catch (err) {
            console.error(`Handler error: ${err}`)
          }
        })
      )
    })
  )
}

// The translation function
const doTranslation = async (Bucket, Key, targetLanguage) => {
  // Get original text from object in incoming event
  const originalText = await s3.send(new GetObjectCommand({ Bucket, Key }))

  // Translate the text
  const data = await translateText(await originalText.Body.transformToString('utf-8'), targetLanguage)

  // Save the new translation
  const baseObjectName = Key.replace(/\.txt$/, '')
  await s3.send(new PutObjectCommand({
    Bucket,
    Key: `translations/${baseObjectName}-${targetLanguage}.txt`,
    Body: data.TranslatedText,
    ContentType: 'text/plain'
  }))
}

/**
 * Returns TRUE if the first specified array contains all elements
 * from the second one. FALSE otherwise.
 *
 * @param {array} superset
 * @param {array} subset
 *
 * @returns {boolean}
 */
function arrayContainsArray (superset, subset) {
  return subset.every(function (value) {
    return (superset.indexOf(value) >= 0)
  })
}