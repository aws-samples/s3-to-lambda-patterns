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

const { TranslateClient, TranslateTextCommand } = require('@aws-sdk/client-translate')
const translate = new TranslateClient({ region: ( process.env.AWS_REGION || 'us-east-1' ) })

// The maximum number of characters you can submit in a single Translate request.
// This truncates the input, so only the first MAX_LENGTH characters will be translated.
const MAX_LENGTH = 5000   

const translateText = async (originalText, targetLanguageCode) => {
  const params = {
      Text: originalText.substring(0, MAX_LENGTH),
      SourceLanguageCode: "auto",
      TargetLanguageCode: targetLanguageCode
  }

  try {
    const data = await translate.send(new TranslateTextCommand(params))
    console.log('Data: ', data)
    return data
  } catch (err) {
    console.log('Error: ', err)
    throw err
  }
}

module.exports = { translateText }
