# Example 4 - S3 to Step Functions workflow

This identifies JPG images put into the S3 bucket as a dog, cat or unknown animal, using the state machine workflow created in template.yaml.

Important: this application uses various AWS services and there are costs associated with these services after the Free Tier usage - please see the [AWS Pricing page](https://aws.amazon.com/pricing/) for details. You are responsible for any AWS costs incurred. No warranty is implied in this example.

```bash
.
├── README.MD                   <-- This instructions file
├── processFunction             <-- Source code for a lambda function
│   └── app.js                  <-- Starts the workflow
├── foundFunction               <-- Source code for a lambda function
│   └── cat.js                  <-- Main Lambda handler for cat images
│   └── dog.js                  <-- Main Lambda handler for dog images
├── template.yaml               <-- SAM template
```

## Requirements

* AWS CLI already configured with Administrator permission
* [NodeJS 12.x installed](https://nodejs.org/en/download/)

## Installation Instructions

1. [Create an AWS account](https://portal.aws.amazon.com/gp/aws/developer/registration/index.html) if you do not already have one and login.

1. From the command line, run:
```
sam package --output-template-file packaged.yaml --s3-bucket <<enter deployment bucket name>>
sam deploy --template-file packaged.yaml --capabilities CAPABILITY_IAM --stack-name example4-workflow --region <<enter your region>>
```

## Parameter Details

* InputBucketName: the unique name of a new S3 bucket for this application (bucket names must be lowercase only and globally unique across AWS)

## How it works

* Upload an image file (ending in the suffix '.jpg') to the target S3 bucket.
* This will trigger a state machine. The first Lambda function uses Rekognition to determine if the image is a dog or cat.
* This determines whether the dog or cat handler is run. If neither is present, the state machine throws an error.

==============================================

Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.

SPDX-License-Identifier: MIT-0