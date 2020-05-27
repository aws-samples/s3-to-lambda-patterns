# Example 3 - DynamoDB importer

The DynamoDB importer will automatically convert import a JSON array from an S3 object into Amazon DynamoDB.

Important: this application uses various AWS services and there are costs associated with these services after the Free Tier usage - please see the [AWS Pricing page](https://aws.amazon.com/pricing/) for details. You are responsible for any AWS costs incurred. No warranty is implied in this example.

```bash
.
├── README.MD                   <-- This instructions file
├── importFunction              <-- Source code for a lambda function
│   └── app.js                  <-- Main Lambda handler
│   └── s3.js                   <-- S3 helper functions
│   └── test.js                 <-- For testing code locally
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
sam package --output-template-file packaged.yaml --s3-bucket <<enter deployment bucket name>>
sam deploy --template-file packaged.yaml --capabilities CAPABILITY_IAM --stack-name example3-import --region us-east-1 --parameter-overrides InputBucketName=<<enter translation bucket name>>
```

## Parameter Details

* InputBucketName: the unique name of a new S3 bucket for this application (bucket names must be lowercase only and globally unique across AWS)

## How it works

* Upload a JSON file (a JSON array ending with .json) to the target S3 bucket.
* After a few seconds you will see the contents imported into a DynamoDB table created by the SAM deploment.
* This process uses on-demand provisioning in DynamoDB.

==============================================

Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.

SPDX-License-Identifier: MIT-0