// index.js

const serverless = require('serverless-http');
const express = require('express')
const cors = require('cors')
const app = express()
const port = process.env.PORT || 3001
const bodyParser = require('body-parser')

const AWS = require('aws-sdk')
AWS.config.update({region: 'us-east-1'})

const ddb = new AWS.DynamoDB() 
const ddbGeo = require('dynamodb-geo')

const config = new ddbGeo.GeoDataManagerConfiguration(ddb, 'askJames-wheresStarbucks')
config.hashKeyLength = 5

const myGeoTableManager = new ddbGeo.GeoDataManager(config)
const SEARCH_RADIUS_METERS = 1000

// Configure middleware
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.post('/', function (req, res) {
  if (!req.body.lat || !req.body.lng) return res.status(422).send('Missing parameters')

  console.log(`Called with ${req.body}`)
  myGeoTableManager.queryRadius({
    RadiusInMeter: SEARCH_RADIUS_METERS,
    CenterPoint: {
        latitude: req.body.lat,
        longitude: req.body.lng
    }
  })
  .then((locations) => {
    console.log('Locations found: ', locations.length)
    res.send(locations)
  })  
})

// if running locally
if (!process.env.PORT) {
  app.listen(port, () => console.log(`DEV MODE: listening on ${port}`))
}

module.exports.handler = serverless(app)
