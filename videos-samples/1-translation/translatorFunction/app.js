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
AWS.config.region = (process.env.AWS_REGION || 'us-east-1')

const { getS3object, putS3object }  = require('./s3')
const { translateText } = require('./translate')

// Entire list of language codes at: https://docs.aws.amazon.com/translate/latest/dg/how-it-works.html#how-it-works-language-codes
const supportedLanguages = ['ar','zh','zh-TW','cs','da','nl','en','fi','fr','de','he','hi','id','it','ja','ko','ms','no','fa','pl','pt','ru','es','sv','tr']
const targetLanguages = process.env.targetLanguage.split(' ')

// The standard Lambda handler
exports.handler = async (event) => {

  // Don't fire for any new file in the translations folder
  if (event.Records[0].s3.object.key.indexOf('translations') > -1) return

  // Check incoming language list matches supported languages
  if (arrayContainsArray(supportedLanguages, targetLanguages) === false) {
    return console.error(`Aborting: targetLanguages includes language codes not in supported list (${supportedLanguages})`)
  }

  await Promise.all(
      targetLanguages.map(async (targetLanguage) => {
        try {
          await doTranslation(event, targetLanguage)
        } catch (err) {
          console.error('Handler error: ', err)
        }
      })
  )

  return {
    statusCode: 200
  }
}

// The translation function
const doTranslation = async (event, targetLanguage) => {
  return new Promise(async (resolve, reject) => {
      
    // Get original text from object in incoming event
    const originalText = await getS3object({
      Bucket: event.Records[0].s3.bucket.name,
      Key: event.Records[0].s3.object.key
    })
 
    // Translate the text
    const data = await translateText(originalText.Body.toString('utf-8'), targetLanguage)

    // Save the new translation
    const baseObjectName = event.Records[0].s3.object.key.replace('.txt','')
    await putS3object({
      Bucket: event.Records[0].s3.bucket.name,
      Key: `translations/${baseObjectName}-${targetLanguage}.txt`,
      Body: data.TranslatedText,
      ContentType: 'text/plain'
    })
    resolve()
  })
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
    return (superset.indexOf(value) >= 0);
  });
}