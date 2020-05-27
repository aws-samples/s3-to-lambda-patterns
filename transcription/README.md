# Audio analyzer - Auto-transcriber and sentiment analyzer

This application automatically transcribes uploaded MP3 audio files, and stores the results of a sentiment analysis in a DynamoDB table.

Important: this application uses various AWS services and there are costs associated with these services after the Free Tier usage - please see the [AWS Pricing page](https://aws.amazon.com/pricing/) for details. You are responsible for any AWS costs incurred. No warranty is implied in this example.

To learn more about how this application works, see the article on the AWS Compute Blog: [Converting call center recordings into useful data for analytics](https://aws.amazon.com/blogs/compute/converting-call-center-recordings-into-useful-data-for-analytics/).

```bash
.
├── README.MD                   <-- This instructions file
├── sentimentFunction           <-- Source code for a lambda function
│   └── app.js                  <-- Main Lambda handler
│   └── processRecord.js        <-- Business logic
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

1. Clone the repo onto your local development machine using `git clone`.

1. From the command line, change directory into v1 or v2 depending on the version required, then run:
```
sam build
sam deploy --guided
```
Follow the prompts in the deploy process to set the stack name, AWS Region and other parameters.

## Parameter Details

* InputBucketName: the unique name of a new S3 bucket for this application (bucket names must be lowercase only and globally unique across AWS).

## How it works

* Upload an MP3 file of a person speaking (ending in the suffix '.mp3') to the target S3 bucket.
* After a few seconds you will see a transcription file in the same bucket (using the same object name with .json appended).
* This triggers a sentiment analysis with Amazon Comprehend and the result is stored in an Amazon DynamoDB table.

==============================================

Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.

SPDX-License-Identifier: MIT-0
