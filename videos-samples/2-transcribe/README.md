# Example 2 - S3 Auto-transcriber and sentiment analyzer

The S3 Auto-transcriber and sentiment analyzer will automatically convert uploaded MP3 files into transcribed text, using Amazon Transcribe. The resulting text is used to run a sentiment analysis with AWS Comprehend, and then store the result in DynamoDB.

Important: this application uses various AWS services and there are costs associated with these services after the Free Tier usage - please see the [AWS Pricing page](https://aws.amazon.com/pricing/) for details. You are responsible for any AWS costs incurred. No warranty is implied in this example.

This code was originally presented at re:Invent 2019, session ID SVS214.


```bash
.
├── README.MD                   <-- This instructions file
├── sentimentFunction           <-- Source code for a lambda function
│   └── app.js                  <-- Main Lambda handler
│   └── s3.js                   <-- S3 helper functions
│   └── package.json            <-- NodeJS dependencies and scripts
├── transcribeFunction          <-- Source code for a lambda function
│   └── app.js                  <-- Main Lambda handler
│   └── package.json            <-- NodeJS dependencies and scripts
├── template.yaml               <-- SAM template
```

## Requirements

* AWS CLI already configured with Administrator permission
* [NodeJS 12.x installed](https://nodejs.org/en/download/)

## Installation Instructions

1. [Create an AWS account](https://portal.aws.amazon.com/gp/aws/developer/registration/index.html) if you do not already have one and login.

1. From the command line, run:
```
sam build
sam deploy --template-file packaged.yaml --capabilities CAPABILITY_IAM --stack-name auto-transcriber --region <<enter your region>> --parameter-overrides InputBucketName=<<enter translation bucket name>>
```

## Parameter Details

* InputBucketName: the unique name of a new S3 bucket for this application (bucket names must be lowercase only and globally unique across AWS)

## How it works

* Upload an MP3 file of a person speaking (ending in the suffix '.mp3') to the target S3 bucket.
* After a few seconds you will see a transcription file in the same bucket (using the same object name with .json appended).
* This triggers a sentiment analysis with Amazon Comprehend and the result is stored in an Amazon DynamoDB table.

==============================================

Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.

SPDX-License-Identifier: MIT-0