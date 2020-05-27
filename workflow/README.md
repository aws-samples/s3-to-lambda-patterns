# S3-to-Step Functions - Automated workflows at scale

This repo contains an AWS SAM template that deploys a serverless application. This application uses Amazon Rekognition to match incoming documents, and then using Step Functions to run the appropriate next steps. This example is designed to demonstrate how to configure the state machine and required Lambda functions.

This architecture is designed for to scale for large numbers of S3 objects. For full details on how this works, read the article at: TBD.

Important: this application uses various AWS services and there are costs associated with these services after the Free Tier usage - please see the [AWS Pricing page](https://aws.amazon.com/pricing/) for details. You are responsible for any AWS costs incurred. No warranty is implied in this example.

```bash
.
├── README.MD                   <-- This instructions file
├── processFunction             <-- Starts the Step Functions execution
│   └── app.js                  <-- Source code for a lambda function
├── deciderFunction             <-- Decides if the input matches or not
│   └── app.js                  <-- Starts the workflow
├── resultFunction              <-- Source code for a lambda function
│   └── match.js                <-- Main Lambda handler for matching results
│   └── noMatch.js              <-- Main Lambda handler for non-matching results
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

## Parameter Details

* InputBucketName: the unique name of a new S3 bucket for this application (bucket names must be lowercase only and globally unique across AWS)

## How it works

* Upload an image file (ending in the suffix '.jpg' or '.png') to the target S3 bucket.
* This will trigger a state machine. The DeciderFunction uses environment variables to determine what to identify in the incoming image.
* This causes the "Match" or "NoMatch" function to run. If there is an error in the Lambda function(s), the state machine throws an error.
* The default configuration in the template.yaml file is set up to identify cats. If you upload a picture of a cat to the S3 bucket, it causes a match.

==============================================

Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.

SPDX-License-Identifier: MIT-0