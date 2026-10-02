// Unlike S3 event notifications sent directly to Lambda, object keys in
// S3 EventBridge events are not URL-encoded, so they can be used as-is
const getObjectKey = (event) => event.detail.object.key

// The standard Lambda handler

exports.handler = async (event) => {
  console.log(JSON.stringify(event, null, 2))
  console.log(`Bucket: ${event.detail.bucket.name}, Key: ${getObjectKey(event)}`)
}
