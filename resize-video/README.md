
# Video resizer example

This example application shows how to resize an MP4 video when uploaded to an S3 bucket. To learn more about how this application works, see the post on the AWS Compute Blog: TBD.

Important: this application uses various AWS services and there are costs associated with these services after the Free Tier usage - please see the [AWS Pricing page](https://aws.amazon.com/pricing/) for details. You are responsible for any AWS costs incurred. No warranty is implied in this example.

```bash
.
├── README.MD              <-- This instructions file
├── resize-video           <-- Source code for the video resizer function
```

## Requirements

* An AWS account. ([Create an AWS account](https://portal.aws.amazon.com/gp/aws/developer/registration/index.html) if you do not already have one and login.)
* AWS CLI already configured with Administrator permission
* [AWS SAM CLI installed](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html) - **minimum version 0.48**.
* [NodeJS 14.x installed](https://nodejs.org/en/download/)

## Backend installation Instructions

1. First, create a Lambda layer containing the FFmpeg and FFprobe binaries. Log into your AWS Management Console and navigate to: https://serverlessrepo.aws.amazon.com/applications/us-east-1/145266761615/ffmpeg-lambda-layer.

2. Choose *Deploy* and note the ARN for the resulting Lambda layer.

3. Clone this repo onto your local development machine:
```
git clone https://github.com/aws-samples/s3-to-lambda-patterns
cd resize-video
```
4. Deploy the backend application:
```
sam build
sam deploy --guided
```
5. During the prompts:
- Enter a unique source S3 bucket name.
- Enter a unique destination S3 bucket name.
- Enter the MMmpeg layer ARN from step 2.

After deployment, upload an MP4 file to the source S3 bucket and the application generates output files in the destination S3 bucket.

## Cleanup

1. Manually delete any objects in the application's S3 buckets.
2. Use the CloudFormation console to delete all the stacks deployed or use `sam delete`.

## Next steps

The AWS Compute Blog series at the top of this README file contains additional information about the application design and architecture.

If you have any questions, please contact the author or raise an issue in the GitHub repo.

==============================================

Copyright 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.

SPDX-License-Identifier: MIT-0
