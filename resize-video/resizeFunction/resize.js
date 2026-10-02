/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: MIT-0
 */

'use strict'

// Configure S3
const AWS = require('aws-sdk')
AWS.config.update({ region: process.env.AWS_REGION })
const s3 = new AWS.S3({ apiVersion: '2006-03-01' })

// Set ffpmeg
const ffmpegPath = (process.env.localTest) ? require('@ffmpeg-installer/ffmpeg').path : '/opt/bin/ffmpeg'
const ffTmp = (process.env.localTest) ? './tmp' : '/tmp'

const { execFile } = require('child_process')
const { tmpCleanup } = require('./tmpCleanup.js')

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

	const data = await s3.getObject({
		Bucket: record.s3.bucket.name,
		Key
	}).promise()

	// Use generated local filenames - never derive filesystem paths from the S3 key
	const jobId = crypto.randomBytes(16).toString('hex')
	const tempFile = path.join(ffTmp, `${jobId}-input.mp4`)
	const tempOutput = path.join(ffTmp, `${jobId}-output.mp4`)

	// Save original to tmp directory
	console.log('Saving downloaded file to ', tempFile)
	fs.writeFileSync(tempFile, data.Body)

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
	await s3.putObject({
		Bucket: process.env.OutputBucketName,
		Key: outputFilename,
		Body: tmpData
	}).promise()
	console.log(`Object written to ${process.env.OutputBucketName}`)

	// Clean up temp files
	console.log('Cleaning up temporary files')
	await tmpCleanup ()
}

module.exports = { resizeVideo }