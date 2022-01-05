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

const { exec } = require('child_process')
const { tmpCleanup } = require('./tmpCleanup.js')

const fs = require('fs')

// Promisified wrapper for child_process.exec
const execPromise = async (command) => {
	return new Promise((resolve, reject) => {
		const ls = exec(command, function (error, stdout, stderr) {
		  if (error) {
		    console.log('Error: ', error)
		    reject(error)
		  }
		  if (stdout) console.log('stdout: ', stdout)
		  if (stderr) console.log('stderr: ' ,stderr)
		})

		ls.on('exit', (code) => {
		  if (code != 0) console.log('execPromise finished with code ', code)
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

	// Save original to tmp directory
	const tempFile = `${ffTmp}/${Key}`
	console.log('Saving downloaded file to ', tempFile)
	fs.writeFileSync(tempFile, data.Body)

	// Save resized video to /tmp
	const outputFilename = `${Key.split('.')[0]}-smaller.mp4`
	console.log(`Resizing and saving to ${outputFilename}`)
	await execPromise(`${ffmpegPath} -i "${tempFile}" -loglevel error -vf scale=160:-1 -sws_flags fast_bilinear ${ffTmp}/${outputFilename}`)

	console.log('Read tmp file into tmpData')
	const tmpData = fs.readFileSync(`${ffTmp}/${outputFilename}`)
	console.log(`tmpData size: ${tmpData.length}`)

	// Upload to S3
	console.log(`Uploading ${outputFilename} to ${outputFilename}`)
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