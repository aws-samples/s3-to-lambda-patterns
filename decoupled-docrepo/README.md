# S3 DocRepo - Decoupling using Amazon EventBridge

This repo contains AWS SAM templates that deploy serverless applications. This application uses Amazon ML services like Comprehend and Rekognition to index documents and images, and then sends the results to the Amazon Elasticsearch Service for fast indexing.

The applicaton features are identical to the [Serverless Document Repository repo](https://github.com/jbesw/s3-to-lambda/tree/master/docrepository). This version of the application shows how to split a monolith into smaller applicatons using an event-based architecture, with Amazon EventBridge as the serverless event bus.

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

## Requirements

* AWS CLI already configured with Administrator permission
* [NodeJS 12.x installed](https://nodejs.org/en/download/)

## Installation Instructions

1. [Create an AWS account](https://portal.aws.amazon.com/gp/aws/developer/registration/index.html) if you do not already have one and login.

1. Clone the repo onto your local development machine using `git clone`.

1. From the command line, change directory into the setup folder, then run:
```
sam package --output-template-file packaged.yaml --s3-bucket <<YOUR DEPLOYMENT BUCKET>
sam deploy --template-file packaged.yaml --capabilities CAPABILITY_NAMED_IAM --stack-name docrepo-setup --region us-east-1
```
Modify the stack-name or region parameters as needed.

1. Change directory into the parseS3event directory, then run:
``` 
sam build
sam deploy --guided
```
Follow the prompts in the deploy process to set the stack name, AWS Region, unique bucket names, Elasticsearch domain endpoint, and other parameters.

1. Deploy each of the SAM templates in the analyzers, converters and loaders directly in sequence, using the sam build and sam deploy commands shown in the previous step.

## How it works

* Ensure you have an Amazon Elasticsearch Service instance running, and have granted permission to the ARN for the "loadToES" Lambda function in this stack. 
* Upload PDF, DOCX or JPG files to the target Documents buckets.
* After a few seconds you will see the index in Elasticsearch has been updated with labels and entities for the object.

==============================================

Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.

SPDX-License-Identifier: MIT-0
