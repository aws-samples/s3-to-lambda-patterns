# S3-to-Translate - Language Translation at Scale

This auto translation repo contains two sample applications demonstrating two methods of translating documents automatically. The first integrates S3 to Amazon Translate, and the second modifies the workflow for scale.

Important: this application uses various AWS services and there are costs associated with these services after the Free Tier usage - please see the [AWS Pricing page](https://aws.amazon.com/pricing/) for details. You are responsible for any AWS costs incurred. No warranty is implied in this example.

```bash
.
├── README.MD                   <-- This instructions file
├── addToQueueFunction          <-- Source code for a lambda function
│   └── app.js                  <-- Main Lambda handler
│   └── array.js                <-- Helper functions
│   └── package.json            <-- NodeJS dependencies and scripts
├── batchingFunction            <-- Source code for a lambda function
│   └── app.js                  <-- Main Lambda handler
│   └── package.json            <-- NodeJS dependencies and scripts
├── translatorFunction          <-- Source code for a lambda function
│   └── app.js                  <-- Main Lambda handler
│   └── translate.js            <-- Wrapper for Amazon Translate service
│   └── package.json            <-- NodeJS dependencies and scripts
├── template.yaml               <-- SAM template
```

## Requirements

* AWS CLI already configured with Administrator permission
* [NodeJS 12.x installed](https://nodejs.org/en/download/)

## Installation Instructions

Possible language list:
ar zh zh-TW cs da nl fi fr de he hi id it ja ko ms no fa pl pt ru es sv tr

1. [Create an AWS account](https://portal.aws.amazon.com/gp/aws/developer/registration/index.html) if you do not already have one and login.

1. Clone the repo onto your local development machine using `git clone`.

1. There are two applications. A detailed description of these applications is available at *LINK TBD*.

1. From the command line, change directory into v1 or v2 depending on the version required, then run:
```
sam build
sam deploy --guided
```
Follow the prompts in the deploy process to set the stack name, AWS Region and other parameters.

## Parameter Details

* Target Language: a space-separated list of languages to translate the original text into (e.g. "fr es de")
* InputBucketName: the unique name of a new S3 bucket for this application (bucket names must be lowercase only and globally unique across AWS)
* BatchingBucketName: the unique name of a new S3 bucket for this application.
* ResultsBucketName: the unique name of a new S3 bucket for this application (v2 only)

## How it works

* Upload a text file (ending in the suffix '.txt') to the target S3 bucket.
* After a few seconds you will see translation files appearing in the 'translations' folder in the same bucket (or in the Results bucket for v2).

## Best practices for invoking Lambda functions from S3

When writing objects back to the same bucket, it's important to use different prefixes or suffixes in Lambda notification triggers to avoid recursively invoking the same Lambda function. If your notification ends up writing to the bucket that triggers the notification, this could cause an execution loop. For example, if the bucket triggers a Lambda function each time an object is uploaded, and the function uploads an object to the bucket, then the function indirectly triggers itself. To avoid this, use two buckets, or configure the trigger to only apply to a prefix used for incoming objects. To learn more, read more about [configuring S3 notifications](https://docs.aws.amazon.com/AmazonS3/latest/dev/NotificationHowTo.html).

==============================================

Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.

SPDX-License-Identifier: MIT-0
