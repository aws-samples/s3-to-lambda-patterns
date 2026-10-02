// S3 object keys in EventBridge events are URL-encoded
const getObjectKey = (event) => decodeURIComponent(event.detail.object.key.replace(/\+/g, ' '))

// The standard Lambda handler

exports.handler = async (event) => {
  console.log(JSON.stringify(event, null, 2))
  console.log(`Bucket: ${event.detail.bucket.name}, Key: ${getObjectKey(event)}`)
}
