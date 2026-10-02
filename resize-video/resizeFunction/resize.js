/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: MIT-0
 */

'use strict'

// Configure S3
const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3')
const s3 = new S3Client({})

// Set ffpmeg
const ffmpegPath = (process.env.localTest) ? require('@ffmpeg-installer/ffmpeg').path : '/opt/bin/ffmpeg'
const ffTmp = (process.env.localTest) ? './tmp' : '/tmp'

const { execFile } = require('child_process')

const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

// Promisified wrapper for child_process.execFile
// Arguments are passed as an array and no shell is spawned, so values
// derived from S3 object keys are never interpreted as shell syntax.
const execFilePromise = async (file, args) => {
	return new Promise((resolve, reject) => {
		execFile(file, args, { shell: false }, function (error, stdout, stderr) {
		  if (stdout) console.log('stdout: ', stdout)
		  if (stderr) console.log('stderr: ' ,stderr)
		  if (error) {
		    console.log('Error: ', error)
		    return reject(error)
		  }
		  resolve()
		})
	})
}

const resizeVideo = async (record) => {
	// Get signed URL for source object
	const Key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '))

	const data = await s3.send(new GetObjectCommand({
		Bucket: record.s3.bucket.name,
		Key
	}))

	// Use generated local filenames - never derive filesystem paths from the S3 key
	const jobId = crypto.randomBytes(16).toString('hex')
	const tempFile = path.join(ffTmp, `${jobId}-input.mp4`)
	const tempOutput = path.join(ffTmp, `${jobId}-output.mp4`)

	try {
		// Save original to tmp directory
		console.log('Saving downloaded file to ', tempFile)
		fs.writeFileSync(tempFile, Buffer.from(await data.Body.transformToByteArray()))

		// S3 key for the resized video in the output bucket
		const outputFilename = `${Key.replace(/\.mp4$/i, '')}-smaller.mp4`

		// Save resized video to /tmp
		console.log(`Resizing and saving to ${tempOutput}`)
		await execFilePromise(ffmpegPath, [
			'-i', tempFile,
			'-loglevel', 'error',
			'-vf', 'scale=160:-1',
			'-sws_flags', 'fast_bilinear',
			'-y',
			tempOutput
		])

		console.log('Read tmp file into tmpData')
		const tmpData = fs.readFileSync(tempOutput)
		console.log(`tmpData size: ${tmpData.length}`)

		// Upload to S3
		console.log(`Uploading ${tempOutput} to ${outputFilename}`)
		await s3.send(new PutObjectCommand({
			Bucket: process.env.OutputBucketName,
			Key: outputFilename,
			Body: tmpData
		}))
		console.log(`Object written to ${process.env.OutputBucketName}`)
	} finally {
		// Clean up this job's temp files, even if resizing or upload failed.
		// /tmp persists between invocations in a warm execution environment,
		// and only this job's files are removed so other records being
		// processed concurrently are not affected.
		console.log('Cleaning up temporary files')
		await Promise.all([tempFile, tempOutput].map((file) => fs.promises.rm(file, { force: true })))
	}
}

module.exports = { resizeVideo }