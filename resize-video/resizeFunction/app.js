/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: MIT-0
 */

'use strict'

const { resizeVideo } = require('./resize')

// The Lambda handler
exports.handler = async (event) => {
    console.log (JSON.stringify(event, null, 2))

    // Handle each incoming S3 object in the event
    await Promise.all(
      event.Records.map(async (record) => {
        try {
          await resizeVideo(record)
        } catch (err) {
          console.error(`Handler error: ${err}`)
        }
      })
    )
  }