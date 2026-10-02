# S3-to-Step Functions - Automated workflows at scale

This repo contains an AWS SAM template that deploys a serverless application. This application uses Amazon Rekognition to match incoming documents, and then uses Step Functions to run the appropriate next steps. This example is designed to demonstrate how to configure the state machine and required Lambda functions.

> **Updated since the blog post:** the original version used a `deciderFunction` Lambda function to call Rekognition. The state machine now calls Rekognition `DetectLabels` and `DetectText` directly using the Step Functions [AWS SDK service integration](https://docs.aws.amazon.com/step-functions/latest/dg/supported-services-awssdk.html), and uses [JSONata](https://docs.aws.amazon.com/step-functions/latest/dg/transforming-data.html) to decide whether the image matches. The matching rules are now template parameters instead of Lambda environment variables.

This architecture is designed to scale to a large numbers of S3 objects. For full details on how this works, read the article at: https://aws.amazon.com/blogs/compute/automating-scalable-business-workflows-using-minimal-code/.

Important: this application uses various AWS services and there are costs associated with these services after the Free Tier usage - please see the [AWS Pricing page](https://aws.amazon.com/pricing/) for details. You are responsible for any AWS costs incurred. No warranty is implied in this example.

```bash
.
├── README.MD                   <-- This instructions file
├── StartExecutionFunction      <-- Starts the Step Functions execution
│   └── app.js                  <-- Source code for a lambda function
├── resultFunction              <-- Source code for a lambda function
│   └── match.js                <-- Main Lambda handler for matching results
│   └── noMatch.js              <-- Main Lambda handler for non-matching results
├── statemachine
│   └── matcher.asl.json        <-- State machine definition (calls Rekognition directly)
├── template.yaml               <-- SAM template
```

## Requirements

* AWS CLI already configured with Administrator permission
* [NodeJS 24.x installed](https://nodejs.org/en/download/)

## Installation Instructions

1. [Create an AWS account](https://portal.aws.amazon.com/gp/aws/developer/registration/index.html) if you do not already have one and login.

1. Clone the repo onto your local development machine using `git clone`.

1. From the command line, change directory into `workflow`, then run:
```
sam build
sam deploy --guided
```

## Parameter Details

* InputBucketName: a lowercase name prefix for a new S3 bucket for this application. The template appends your account ID and Region (`<prefix>-<account-id>-<region>`) so the bucket name is globally unique.
* RequiredLabels: comma-separated Rekognition labels that must all be detected for a match (default `Cat,Mammal`). Leave empty to skip the label check.
* RequiredWords: comma-separated words that must all be detected in the image text for a match (default empty, which skips the text check).
* MinConfidence: minimum Rekognition confidence for labels and words (default `70`).

Labels and words are case-sensitive and must match what Rekognition returns (for example `Cat`, not `cat`). Values can contain apostrophes, but not double quotes.

## How it works

* Upload an image file (ending in the suffix '.jpg' or '.png') to the target S3 bucket.
* This invokes the StartExecutionFunction Lambda function, which starts the state machine with the bucket name and (decoded) object key.
* If `RequiredLabels` is set, the state machine calls Rekognition `DetectLabels` directly and checks that every required label is present. If `RequiredWords` is set, it calls `DetectText` and checks every required word.
* This causes the "Match" or "NoMatch" function to run. If a Rekognition call fails (for example, the object isn't a supported image), the execution fails.
* The default configuration is set up to identify cats. If you upload a picture of a cat to the S3 bucket, it causes a match.

==============================================

Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.

SPDX-License-Identifier: MIT-0
