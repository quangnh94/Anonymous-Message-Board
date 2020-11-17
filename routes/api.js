
'use strict';

var expect = require('chai').expect;
var mongoose = require('mongoose')
var id = mongoose.Types.ObjectId()
var path = require('path')
var dotenv = require('dotenv').config()
var ObjectId = require('mongodb').ObjectID;


// mongoose connection
mongoose.connect(process.env.DB, {useNewUrlParser: true, useFindAndModify: false, useUnifiedTopology: true, useCreateIndex: true})
mongoose.connection.once('open', () => {
  console.log('Connected to mongoDB database')
})
// mongoose Schema
const Schema = mongoose.Schema
const threadSchema = new Schema({
  text: {type: String, required: true},
  reported: {type: Boolean, required: true, default: false},
  delete_password: {type: String, required: true},
  replycount: {type: Number, default: 0},
  replies: [Object],
}, {
  timestamps: {
    createdAt: 'created_on',
    updatedAt: 'bumped_on'
  }
})

const Thread = mongoose.model('Thread', threadSchema)

module.exports = function (app) {
  
  // create thread
  app.route('/api/threads/:board').post((req, res) => {
    let postData = req.body
    let newThread = new Thread({
      text: postData.text,
      delete_password: postData.delete_password
    })
    newThread.save()
      .then(() => res.redirect('/b/' + postData.board))
      .catch(err => console.log(err))
  
  })  
   // list recent threads
 .get((req, res) => {
    Thread.find({}, {delete_password: 0, reported: 0, replies: {$slice: 3}}).sort({bumped_on: -1}).limit(10)
      .then((d) => res.json(d))
      .catch(err => console.log(err))
  })
  // delete a thread with password
  .delete((req, res) => {
    let deleteData = req.body
    Thread.findOneAndDelete({_id: deleteData.thread_id, delete_password: deleteData.delete_password}, function(err, data) {
      if(err) return res.status(400).json('cannot delete this thread')
      if(data) {
        return res.json('success')
      } else {
        return res.json('incorrect password')
      }
    })
  })
  // report a thread
  .put((req, res) => {
    let putData = req.body
    Thread.findOneAndUpdate({_id: putData.thread_id}, {$set: {reported: true}})
      .then(() => res.json('success'))
      .catch(() => {
        return res.status(400).json('cannot report this thread');
      })
  })

  // create reply
  app.route('/api/replies/:board').post((req, res) => {
    let postData = req.body
    let postParams = req.params.board
    let newReplies = {
      _id: new ObjectId(),
      text: postData.text,
      created_on: new Date(),
      delete_password: postData.delete_password,
      reported: false
    }
    Thread.findOneAndUpdate({_id: postData.thread_id}, {$inc: {replycount: 1}, $push: {
      replies: {
        $each: [newReplies],
        $sort: {created_on: -1}
      }
    }})
      .then(() => res.redirect('/b/' + postParams + '/' + postData.thread_id))
      .catch(err => console.log(err))
   
  })
  // show all replies on thread
 .get((req, res) => {
    let postData = req.query.thread_id
    Thread.findOne({_id: postData}, {delete_password: 0, reported: 0, __v: 0, "replies.delete_password": 0, "replies.reported": 0})
      .then((d) => res.json(d))
      .catch(err => console.log(err))
  })
  // change reply to [deleted] on thread
  .delete((req, res) => {
    let deleteData = req.body
    Thread.findOneAndUpdate({_id: ObjectId(deleteData.thread_id), 'replies._id': ObjectId(deleteData.reply_id), 'replies.delete_password': deleteData.delete_password}, {$set: {
      "replies.$.text": '[deleted]'
    }}).then((d) => {
      if(d) {
        return res.json('success')
      } else {
        return res.json('incorrect password')
      }
    }).catch(() => res.status(400).json('cannot delete this reply'))
  })
  // report a reply on thread
  .put((req, res) => {
    let putData = req.body
    Thread.findOneAndUpdate({_id: putData.thread_id, 'replies._id': ObjectId(putData.reply_id)}, {$set: {'replies.$.reported': true}}).then(() => res.json('success')).catch(() => {
      return res.status(400).json('cannot report this reply');
    })
  })
  
};
