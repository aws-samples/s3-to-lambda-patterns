# S3-to-Elasticsearch - The Serverless Document Repository

This repo contains an AWS SAM template that deploys a serverless application. This application uses Amazon ML services like Comprehend and Rekognition to index documents and images, and then sends the results to Elasticsearch for fast indexing.

This architecture is designed for large numbers of documents by using queuing. For full details on how this works, read the article at: https://aws.amazon.com/blogs/compute/creating-a-searchable-enterprise-document-repository/.

Important: this application uses various AWS services and there are costs associated with these services after the Free Tier usage - please see the [AWS Pricing page](https://aws.amazon.com/pricing/) for details. You are responsible for any AWS costs incurred. No warranty is implied in this example.

```bash
.
├── README.MD                   <-- This instructions file
├── addToQueueFunction          <-- Source code for a lambda function
│   └── app.js                  <-- Main Lambda handler
│   └── package.json            <-- NodeJS dependencies and scripts
├── batchingFunction            <-- Source code for a lambda function
│   └── app.js                  <-- Main Lambda handler
│   └── package.json            <-- NodeJS dependencies and scripts
├── addToESindex                <-- Source code for a lambda function
│   └── app.js                  <-- Main Lambda handler
│   └── package.json            <-- NodeJS dependencies and scripts
├── processDOCX                 <-- Source code for a lambda function
│   └── app.js                  <-- Main Lambda handler
│   └── package.json            <-- NodeJS dependencies and scripts
├── processJPG                  <-- Source code for a lambda function
│   └── app.js                  <-- Main Lambda handler
│   └── package.json            <-- NodeJS dependencies and scripts
├── processPDF                  <-- Source code for a lambda function
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
Follow the prompts in the deploy process to set the stack name, AWS Region, unique bucket names, Elasticsearch domain endpoint, and other parameters.

## How it works

* Ensure you have an Elasticsearch instance running, and have granted permission to the ARN for the "AddToESFunction" Lambda function in this stack. 
* Upload a PDF, DOCX or JPG file to the target Documents bucket.
* After a few seconds you will see the index in Elasticsearch has been updated with labels and entities for the object.

==============================================

Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.

SPDX-License-Identifier: MIT-0
