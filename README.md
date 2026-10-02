# S3-to-Lambda Patterns Series

The applications in this repo are supplementary training materials for the S3-to-Lambda blog series and video series. Each example has its own README.md file for additional instructions.

Important: these applications use various AWS services and there are costs associated with these services after the Free Tier usage. Please see the [AWS Pricing page](https://aws.amazon.com/pricing/) for details. You are responsible for any AWS costs incurred. No warranty is implied in these examples.

## What's changed since the blog posts and videos

The examples have been updated since the original blog posts and videos were published, so some code and setup steps differ from what's shown there. The architectures and patterns are the same.

- **Node.js 24 and AWS SDK for JavaScript v3.** All functions use the `nodejs24.x` runtime and the modular `@aws-sdk/client-*` packages (`client.send(new Command())`) instead of `aws-sdk` v2. Functions run on arm64 (AWS Graviton).
- **Native S3 to EventBridge.** The [eventbridge](./eventbridge) and [decoupled-docrepo](./decoupled-docrepo) examples use [Amazon S3 Event Notifications with EventBridge](https://docs.aws.amazon.com/AmazonS3/latest/userguide/EventBridge.html) instead of CloudTrail data events, so no trail or logging bucket is needed and events arrive faster. Event rules match `detail-type: Object Created` and read `detail.bucket.name` / `detail.object.key`.
- **Step Functions calls Rekognition directly.** The [workflow](./workflow) and [videos-samples/4-workflow](./videos-samples/4-workflow) state machines use the [AWS SDK service integration](https://docs.aws.amazon.com/step-functions/latest/dg/supported-services-awssdk.html) and [JSONata](https://docs.aws.amazon.com/step-functions/latest/dg/transforming-data.html) instead of a Lambda function, and the definitions live in `statemachine/*.asl.json`. S3 still invokes a Lambda function that starts each workflow.
- **Bucket names are prefixes.** Bucket name parameters are suffixed with your account ID and Region (`<prefix>-<account-id>-<region>`) so the defaults are globally unique.
- **resize-video** builds its FFmpeg layer automatically during `sam build` instead of using a Serverless Application Repository layer, and runs FFmpeg without a shell.
- **Fixes:** S3 object keys are URL-decoded consistently, and several bugs were fixed (only the first record in an event being processed, an infinite loop in the batching functions, unhandled promise rejections, and overly broad IAM permissions).

## Video series

Watch the videos accompanying this repo at this YouTube Playlist:
https://www.youtube.com/playlist?list=PLJo-rJlep0EAY0nMNBv0MZ487l1tOFAjh

## Blog series

- [Translating documents at enterprise scale with serverless](https://aws.amazon.com/blogs/compute/translating-documents-at-enterprise-scale-with-serverless/) - see the [translation](./translation) example.
- [Creating a searchable enterprise document repository](https://aws.amazon.com/blogs/compute/creating-a-searchable-enterprise-document-repository/) - see the [docrepository](./docrepository) example.
- [Converting call center recordings into useful data for analytics](https://aws.amazon.com/blogs/compute/converting-call-center-recordings-into-useful-data-for-analytics/) - see the [transcription](./transcription) example.
- [Creating a scalable serverless import process for Amazon DynamoDB](https://aws.amazon.com/blogs/compute/creating-a-scalable-serverless-import-process-for-amazon-dynamodb/) - see the [ddbImporter](./ddbImporter) example.
- [Building scalable serverless applications with Amazon S3 and AWS Lambda](https://aws.amazon.com/blogs/compute/building-scalable-serverless-applications-with-amazon-s3-and-aws-lambda/).

## Videos

All examples from the video series are located in the [videos-samples](./videos-samples) sub-directory.

## Requirements

* AWS CLI already configured with Administrator permission
* [Node.js 24.x installed](https://nodejs.org/en/download/)
* AWS Serverless Application Model ([AWS SAM](https://aws.amazon.com/serverless/sam/)) installed

==============================================

Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.

SPDX-License-Identifier: MIT-0
