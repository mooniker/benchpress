'use strict'

// load environement variables into process.env
require('dotenv').config()

const express = require('express')


// MongoDB/Mongoose ORM dependencies
const mongoose = require('mongoose')
mongoose.Promise = global.Promise // use native ES6 promises
// assert.equal(query.exec().constructor, global.Promise)
const uniqueValidator = require('mongoose-unique-validator')

const va = require('./districts/va')

const request = require('request-promise')

const app = express()

app.get('/ping', (request, response) => response.json({ response: 'pong' }))

// app.all('*', (request, response) => {
//     console.log('Requested Supreme Court')
//     va.supremeCourt().then((json) => response.json(json))
// })

console.log('Benchpress initiated.')

const Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId

// const OpinionAbstractMetaSchema = new Schema({
//     courtName: String,
//     jurisdiction: Schema.Types.Mixed,
//     isPublished: Boolean,
//     hrefSource: String
// })
// const OpinionAbstractMeta = mongoose.model('OpinionAbstractMeta', OpinionAbstractMetaSchema)

const OpinionAbstractSchema = new Schema({
    caseName: String,
    docketNumber: String,
    dateString: String,
    summary: String,
    hrefs: Schema.Types.Mixed,
    meta: Schema.Types.Mixed,
    docketDate: { // used as a unique identifier for now
        type: String,
        unique: true,
        required: true,
    }
})
OpinionAbstractSchema.plugin(uniqueValidator)

const OpinionAbstract = mongoose.model('OpinionAbstract', OpinionAbstractSchema)

mongoose.connect(process.env.MONGO_DB_URL, (obj) => {
    console.log('mongoconnect', obj)
    if (process.argv[2] === undefined) {
        console.log('Database connected.')
    } else {
        console.log('User requests', process.argv[2])
        switch (process.argv[2]) {
            case 'reset':
                mongoose.connection.db.dropDatabase() // blocking
                console.log('Database dropped!')
                break
            case 'print':
                console.log('Print requested.')
                OpinionAbstract.find({}).then((docs) => {
                    if (docs) {
                        console.log('No docs found.')
                    } else {
                        console.log(docs.length, 'docs found.')
                    }
                }).catch(console.error)
                break
            default:
                console.error('Unrecognized command:', process.argv[2])
                process.exit(1) // exit with error
        }
    }
})

app.get('/opinion-leads', (request, response) => {
    OpinionAbstract.find({}).then((docs) => {
        response.json(docs)
    }).catch((err) => {
        response.send(err)
    })
})

app.get('/first', (request, response) => {
    OpinionAbstract.findOne({}).then((doc) => {
        response.json(doc)
    }).catch((err) => {
        response.send(err)
    })
})

app.get('/scrape', (request, response) => {
  console.log('Requested Supreme Court')
  va.supremeCourt().then(opinions => {
    opinions.forEach(opinionAbstract => {
      if (opinionAbstract.docketDate) {
        OpinionAbstract.findOne({
          docketDate: opinionAbstract.docketDate
        }, (err, doc) => {
          if (err) {
            console.error(err)
          } else if (!doc) {
            // if the doc doesn't already exist in db, save it
            new OpinionAbstract(opinionAbstract).save(console.log).catch(console.error)
          } else {
            console.log('Already got this one')
            // TODO double check it against existing record.
          }
        })
      }
    })
  }).then((json) => {
    response.json({
      message: 'stored!',
      data: json
    })
  }).then(() => {
    OpinionAbstract.find({}).then(console.log)
  })
})

app.use('/bower_components', express.static('bower_components'))
app.use(express.static('public'))

app.listen(4000, console.log(`Up and running on port ${4000}.`))
