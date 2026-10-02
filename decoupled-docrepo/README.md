# S3 DocRepo - Decoupling using Amazon EventBridge

This repo contains AWS SAM templates that deploy serverless applications. This application uses Amazon ML services like Comprehend and Rekognition to index documents and images, and then sends the results to the Amazon Elasticsearch Service for fast indexing.

The application features are identical to the [Serverless Document Repository repo](https://github.com/jbesw/s3-to-lambda/tree/master/docrepository). This version of the application shows how to split a monolith into smaller applications using an event-based architecture, with Amazon EventBridge as the serverless event bus.

For full details on how this works, read the article at: https://aws.amazon.com/blogs/compute/decoupling-larger-applications-with-amazon-eventbridge/.

Important: this application uses various AWS services and there are costs associated with these services after the Free Tier usage - please see the [AWS Pricing page](https://aws.amazon.com/pricing/) for details. You are responsible for any AWS costs incurred. No warranty is implied in this example.

```bash
.
├── README.MD                   <-- This instructions file
├── analyzers                   <-- Source code for Lambda functions
│   └── analyzeText             <-- Text analyzer
│   └── analyzeImage            <-- Image analyzer
│   └── template.yaml           <-- SAM template for Analyzers
│   └── package.json            <-- NodeJS dependencies and scripts
├── converters                  <-- Source code for Lambda functions
│   └── processDOCX             <-- Converts DOCX file into text
│   └── processPDF              <-- Converts PDF files into text
│   └── template.yaml           <-- SAM template for Converters
│   └── package.json            <-- NodeJS dependencies and scripts
├── loaders                     <-- Source code for Lambda functions
│   └── loadToES                <-- Load indexing info into ES
│   └── template.yaml           <-- SAM template for Loaders
│   └── package.json            <-- NodeJS dependencies and scripts
├── parseS3event                <-- Source code for a lambda function
│   └── parserFunction          <-- Main Lambda handler
│   └── template.yaml           <-- SAM template for Parser
│   └── package.json            <-- NodeJS dependencies and scripts
├── setup                       <-- Source code for a lambda function
│   └── template.yaml           <-- SAM template for basic application
```

## Event shapes

The department buckets use [Amazon S3 Event Notifications with Amazon EventBridge](https://docs.aws.amazon.com/AmazonS3/latest/userguide/EventBridge.html). The parseS3event rule matches:

```json
{
  "source": ["aws.s3"],
  "detail-type": ["Object Created"],
  "detail": {
    "bucket": { "name": ["<dept1 bucket>", "<dept2 bucket>", "<dept3 bucket>"] }
  }
}
```

The incoming event contains the bucket name in `detail.bucket.name` and the URL-encoded object key in `detail.object.key` (see `parseS3event/parserFunction/localTestEvent.json`). The parser decodes the key and publishes this event to the default bus for the downstream applications:

```json
{
  "source": "docRepo.s3",
  "detail-type": "PutObject",
  "detail": {
    "bucket": "patterns-s3-eventbridge-docs1",
    "key": "resume-paul-renoir.pdf",
    "type": "pdf"
  }
}
```

## Requirements

* AWS CLI already configured with Administrator permission
* [Node.js 24.x installed](https://nodejs.org/en/download/)

## Installation Instructions

1. [Create an AWS account](https://portal.aws.amazon.com/gp/aws/developer/registration/index.html) if you do not already have one and login.

1. Clone the repo onto your local development machine using `git clone`.

1. From the command line, change directory into the setup folder, then run:
```
sam deploy --template-file template.yaml --capabilities CAPABILITY_IAM --stack-name docrepo-setup --region us-east-1
```
This creates the three department buckets (with Amazon EventBridge notifications enabled) and a managed IAM policy that grants read access to them. The policy ARN is exported as `<setup stack name>-S3ReadPolicyArn`. Modify the region as needed. If you use a different stack name, pass it as the `SetupStackName` parameter when deploying the converters and analyzers stacks.

1. Change directory into the parseS3event directory, then run:
``` 
sam build -u
sam deploy --guided
```
Follow the prompts in the deploy process to set the stack name, AWS Region, bucket name prefixes (these must match the prefixes used in the setup stack; both templates append your account ID and Region), and other parameters.

1. Deploy each of the SAM templates in the converters, analyzers and loaders directories in sequence, using the sam build and sam deploy commands shown in the previous step. The converters and analyzers stacks import the S3 read policy exported by the setup stack, so the setup stack must be deployed first (and cannot be deleted while these stacks exist). For the loaders stack, set the Elasticsearch domain endpoint parameter.

## How it works

* Ensure you have an Amazon Elasticsearch Service instance running, and have granted permission to the ARN for the "loadToES" Lambda function in this stack. 
* Upload PDF, DOCX or JPG files to the target Documents buckets.
* Each bucket sends an `Object Created` event directly to the default EventBridge event bus (no AWS CloudTrail trail is needed). The parseS3event function is invoked by a rule matching these events, and publishes a simplified `docRepo.s3` event that the converters and analyzers subscribe to.
* After a few seconds you will see the index in Elasticsearch has been updated with labels and entities for the object.

==============================================

Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.

SPDX-License-Identifier: MIT-0
