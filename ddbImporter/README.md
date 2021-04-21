# S3-to-DynamoDB importer

The Amazon DynamoDB importer automatically imports a JSON array from an S3 object into Amazon DynamoDB.

Important: this application uses various AWS services and there are costs associated with these services after the Free Tier usage - please see the [AWS Pricing page](https://aws.amazon.com/pricing/) for details. You are responsible for any AWS costs incurred. No warranty is implied in this example.

To learn more about how this application works, see the article on the AWS Compute Blog: https://aws.amazon.com/blogs/compute/creating-a-scalable-serverless-import-process-for-amazon-dynamodb/.

See a video of how to use this repo at: https://youtu.be/f0sE_dNrimU.

```bash
.
├── README.MD       <-- This instructions file
├── v1              <-- A simple DynamoDB importer
└── v2              <-- An advanced DynamoDB importer
```

## Requirements

* AWS CLI already configured with Administrator permission
* [NodeJS 12.x installed](https://nodejs.org/en/download/)

## Installation Instructions

1. [Create an AWS account](https://portal.aws.amazon.com/gp/aws/developer/registration/index.html) if you do not already have one and login.

1. Clone the repo onto your local development machine using `git clone`.

1. There are two applications: v1 imports directly in the DynamoDB table, while v2 uses SQS to smooth out the loading process. A detailed description of these applications is available at https://aws.amazon.com/blogs/compute/creating-a-scalable-serverless-import-process-for-amazon-dynamodb/.

1. From the command line, change directory into v1 or v2 depending on the version required, then run:
```
sam build
sam deploy --guided
```
Follow the prompts in the deploy process to set the stack name, AWS Region and other parameters.

## Parameter Details

* InputBucketName: the unique name of a new S3 bucket for this application (bucket names must be lowercase only and globally unique across AWS).

## How it works

* Upload a file (a JSON array) ending with .json to the target S3 bucket. Please note that the JSON file must contain a JSON array, so the format looks like this:

```
[
  {
    "name": "Alice",
    "job": "Solutions Architect"
  },
  {
    "name": "Bob",
    "job": "Cloud Engineer"
  }
]
```

* After a few seconds you will see the contents imported into a DynamoDB table created by the SAM deploment.
* This process uses on-demand provisioning in DynamoDB.

==============================================

Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.

SPDX-License-Identifier: MIT-0
