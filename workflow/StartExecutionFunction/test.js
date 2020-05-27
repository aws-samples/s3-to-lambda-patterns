/*
  Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
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

// Used for testing Rekognition response. Not used in production.

const result = { Labels:
   [ { Name: 'Canine',
       Confidence: 99.93119812011719,
       Instances: [],
       Parents: [Array] },
     { Name: 'Animal',
       Confidence: 99.93119812011719,
       Instances: [],
       Parents: [] },
     { Name: 'Golden Retriever',
       Confidence: 99.93119812011719,
       Instances: [],
       Parents: [Array] },
     { Name: 'Dog',
       Confidence: 99.93119812011719,
       Instances: [Array],
       Parents: [Array] },
     { Name: 'Pet',
       Confidence: 99.93119812011719,
       Instances: [],
       Parents: [Array] } ],
  LabelModelVersion: '2.0' }

const filteredResult = result.Labels.filter(function(item){
  if (item.Name === 'Dog' || item.Name === 'Cat') return item
})

if (filteredResult.length > 0) {
  if (filteredResult[0].Name === 'Dog') console.log ('Dog')
  if (filteredResult[0].Name === 'Cat') return 'Cat'
}

return 'Unknown'
