# S3-to-EventBridge - Patterns for advanced use-cases

This repo contains 4 AWS SAM templates that deploy serverless applications. The applications illustrate difference ways to integrate S3 event producers and Lambda event consumers.

For full details on how this works, read the article at: https://aws.amazon.com/blogs/compute/using-dynamic-amazon-s3-event-handling-with-amazon-eventbridge/.

Important: this application uses various AWS services and there are costs associated with these services after the Free Tier usage - please see the [AWS Pricing page](https://aws.amazon.com/pricing/) for details. You are responsible for any AWS costs incurred. No warranty is implied in this example.

```bash
.
├── README.MD                   <-- This instructions file
├── 1-integration               <-- Source code for a lambda function
│   └── eventConsumer           <-- Main Lambda function directory
│   └── package.json            <-- NodeJS dependencies and scripts
│   └── template.yaml           <-- SAM template
├── 2-existing-bucket           <-- Source code for a lambda function
│   └── eventConsumer           <-- Main Lambda function directory
│   └── package.json            <-- NodeJS dependencies and scripts
│   └── template.yaml           <-- SAM template
├── 3-multi-bucket              <-- Source code for a lambda function
│   └── eventConsumer           <-- Main Lambda function directory
│   └── package.json            <-- NodeJS dependencies and scripts
│   └── template.yaml           <-- SAM template
├── 4-multi-multi               <-- Source code for a lambda function
│   └── eventConsumer           <-- Main Lambda function directory
│   └── package.json            <-- NodeJS dependencies and scripts
│   └── template.yaml           <-- SAM template
```

## Requirements

* AWS CLI already configured with Administrator permission
* [NodeJS 12.x installed](https://nodejs.org/en/download/)

## Installation Instructions

1. [Create an AWS account](https://portal.aws.amazon.com/gp/aws/developer/registration/index.html) if you do not already have one and login.

1. Clone the repo onto your local development machine using `git clone`.

1. From the command line, change directory into the application version required, then run:
```
sam deploy --guided
```
Follow the prompts in the deploy process to set the stack name, AWS Region, unique bucket names, and other parameters.

## How it works

* After deploying, uploading objects to the application's S3 bucket(s) invokes the associated Lambda functions.
* The templates show different ways of associating S3 buckets and Lambda targets using Amazon EventBridge.

==============================================

Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.

SPDX-License-Identifier: MIT-0
