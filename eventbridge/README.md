# S3-to-EventBridge - Patterns for advanced use-cases

This repo contains 4 AWS SAM templates that deploy serverless applications. The applications illustrate different ways to integrate S3 event producers and Lambda event consumers.

These samples use Amazon S3's native [Amazon EventBridge integration](https://docs.aws.amazon.com/AmazonS3/latest/userguide/EventBridge.html). Each bucket has EventBridge notifications turned on, so S3 sends its object events straight to the default event bus in your account. You don't need an AWS CloudTrail trail, a logging bucket, or a bucket policy, and events reach EventBridge without the delay that CloudTrail delivery used to add.

The samples were first written to use CloudTrail data events, as described in [Using dynamic Amazon S3 event handling with Amazon EventBridge](https://aws.amazon.com/blogs/compute/using-dynamic-amazon-s3-event-handling-with-amazon-eventbridge/). They now use the native integration that was [launched in November 2021](https://aws.amazon.com/blogs/aws/new-use-amazon-s3-event-notifications-with-amazon-eventbridge/).

Important: this application uses various AWS services and there are costs associated with these services after the Free Tier usage - please see the [AWS Pricing page](https://aws.amazon.com/pricing/) for details. You are responsible for any AWS costs incurred. No warranty is implied in this example.

```bash
.
├── README.MD                   <-- This instructions file
├── 1-integration               <-- One bucket, one consumer
│   └── eventConsumer           <-- Lambda function code (app.js, package.json)
│   └── template.yaml           <-- SAM template
├── 2-existing-bucket           <-- An existing bucket, one consumer
│   └── eventConsumer           <-- Lambda function code (app.js, package.json)
│   └── template.yaml           <-- SAM template
├── 3-multi-bucket              <-- Three buckets, one consumer
│   └── eventConsumer           <-- Lambda function code (app.js, package.json)
│   └── template.yaml           <-- SAM template
├── 4-multi-multi               <-- Three buckets, three consumers
│   └── eventConsumer1..3       <-- Lambda function code (app.js, package.json)
│   └── template.yaml           <-- SAM template
```

## Requirements

* AWS CLI already configured with Administrator permission
* [NodeJS 24.x installed](https://nodejs.org/en/download/)

## Installation Instructions

1. [Create an AWS account](https://portal.aws.amazon.com/gp/aws/developer/registration/index.html) if you do not already have one and login.

1. Clone the repo onto your local development machine using `git clone`.

1. From the command line, change directory into the application version required, then run:
```
sam deploy --guided
```
Follow the prompts in the deploy process to set the stack name, AWS Region, bucket name prefixes (the templates append your account ID and Region to make them globally unique), and other parameters.

### Enabling EventBridge on an existing bucket (2-existing-bucket)

The `2-existing-bucket` template doesn't create the bucket named in `ExistingBucketName`, so CloudFormation can't turn on its EventBridge notifications. Turn them on yourself with the AWS CLI.

> **Warning:** `put-bucket-notification-configuration` **replaces** the bucket's entire notification configuration. Any existing Lambda, Amazon SQS, or Amazon SNS notifications that you leave out of the request are deleted.

1. Check the bucket's current notification configuration:
    ```bash
    aws s3api get-bucket-notification-configuration --bucket <name>
    ```
1. If the output is empty, turn on EventBridge with:
    ```bash
    aws s3api put-bucket-notification-configuration --bucket <name> --notification-configuration '{"EventBridgeConfiguration": {}}'
    ```
    If the output already contains configurations (for example `LambdaFunctionConfigurations`, `QueueConfigurations`, or `TopicConfigurations`), add `"EventBridgeConfiguration": {}` to that JSON instead. Then pass the merged document to `--notification-configuration`, so that the existing notifications are kept.

You can also turn it on in the S3 console: open the bucket's **Properties** tab, find **Amazon EventBridge**, and choose **Edit**. This changes only the EventBridge setting.

## How it works

* After deploying, uploading objects to the application's S3 bucket(s) invokes the associated Lambda functions.
* The templates show different ways of associating S3 buckets and Lambda targets using Amazon EventBridge.
* Each bucket has `NotificationConfiguration.EventBridgeConfiguration.EventBridgeEnabled` set to `true`, so S3 sends all of its object events (`Object Created`, `Object Deleted`, and others) to the default event bus. EventBridge rules then choose which events go to which targets.
* The EventBridge rules match `Object Created` events from the deployed buckets. This covers `PutObject`, `CopyObject`, `CompleteMultipartUpload`, and `PostObject`. The `detail.reason` field tells you which operation created the object:

```yaml
EventPattern:
  source:
    - aws.s3
  detail-type:
    - Object Created
  detail:
    bucket:
      name:
        - !Ref SourceBucket
```

* To narrow the match, add filters on the object key, for example `object: { key: [{ prefix: "images/" }] }` or `[{ suffix: ".jpg" }]` under `detail`.
* An example event delivered to the Lambda functions:

```json
{
  "version": "0",
  "id": "17793124-05d4-b198-2fde-7ededc63b103",
  "detail-type": "Object Created",
  "source": "aws.s3",
  "account": "123456789012",
  "time": "2026-10-02T18:43:48Z",
  "region": "us-east-1",
  "resources": ["arn:aws:s3:::patterns-s3-eventbridge-src-bucket"],
  "detail": {
    "version": "0",
    "bucket": { "name": "patterns-s3-eventbridge-src-bucket" },
    "object": {
      "key": "example-key.txt",
      "size": 5,
      "etag": "b1946ac92492d2347c6235b4d2611184",
      "sequencer": "00617F08299329D189"
    },
    "request-id": "N4N7GDK58NMKJ12R",
    "requester": "123456789012",
    "source-ip-address": "1.2.3.4",
    "reason": "PutObject"
  }
}
```

* The Lambda functions read the bucket name from `event.detail.bucket.name` and the object key from `event.detail.object.key`. Object keys in these events are URL-encoded, so the functions decode the key before using it.

==============================================

Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.

SPDX-License-Identifier: MIT-0
