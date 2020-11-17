/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!)
*/

var chaiHttp = require('chai-http');
var chai = require('chai');
var assert = chai.assert;
var server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
  
  var idToDelete;
  var idToReport;
  var replyToReport;

  suite('API ROUTING FOR /api/threads/:board', function() {
    
    suite('POST', function() {
      test('POST two new threads to board "test"', function(done){
        chai.request(server)
          .post('/api/threads/test/')
          .send({text: 'test text1', delete_password: 'delete'})
          .end((err,res) => {
            assert.equal(res.status, 200);
          })
        chai.request(server)
          .post('/api/threads/test')
          .send({text: 'test text2', delete_password: 'delete'})
          .end((err,res) => {
            assert.equal(res.status, 200);
            done();
          })
      })
    });
    
    suite('GET', function() {
      test('GET 10 most recent bumped threads with 3 most recent replies', function(done){
        chai.request(server)
          .get('/api/threads/test/')
          .end((err,res) => {
            assert.equal(res.status, 200);
            assert.isArray(res.body);
            assert.isAtMost(res.body.length, 10);
            assert.isArray(res.body[0].replies);
            assert.isAtMost(res.body[0].replies.length, 3);
            idToDelete = res.body[0]._id;
            idToReport = res.body[1]._id;
            done();
          })
      })
    });
    
    suite('DELETE', function() {
      test('DELETE with wrong password returns "incorrect password"',function(done){
        chai.request(server)
          .delete('/api/threads/test/')
          .send({thread_id: idToDelete, delete_password: 'wrong'})
          .end((err,res) => {
            assert.equal(res.status, 200);
            assert.equal(res.body, 'incorrect password');
            done()
          })
      })
      test('DELETE with correct password returns "success"',function(done){
        chai.request(server)
          .delete('/api/threads/test')
          .send({thread_id: idToDelete, delete_password: 'delete'})
          .end((err,res) => {
            assert.equal(res.status, 200);
            assert.equal(res.body, 'success');
            done();
          })
      })
    });
    
    suite('PUT', function() {
      test('PUT with thread_id to report thread returns "success"', function(done){
        chai.request(server)
          .put('/api/threads/test')
          .send({thread_id: idToReport})
          .end((err,res) => {
            assert.equal(res.status, 200);
            assert.equal(res.body, 'success');
            done();
          })
      })
    });
    

  });
  
  suite('API ROUTING FOR /api/replies/:board', function() {
    
    suite('POST', function() {
      test('POST a reply to a thread', function(done){
        // text, delete_password, & thread_id
        chai.request(server)
          .post('/api/replies/test')
          .send({text: 'first reply test', delete_password: 'deletereply', thread_id: idToReport})
          .end((err,res) => {
            assert.equal(res.status, 200);
            done();
          })
      })
    });
    
    suite('GET', function() {
      test('GET thread with all replies', function(done){
        chai.request(server)
          .get('/api/replies/test')
          .query({thread_id: idToReport})
          .end((err,res) => {
            assert.equal(res.status,200);
            assert.isArray(res.body.replies);
            assert.equal(res.body.replies[0].text, 'first reply test');
            replyToReport = res.body.replies[0]._id;
            done();
          })
      })
    });
    
    suite('PUT', function() {
      test('PUT thread_id & reply_id to report a thread, returned is "success"', function(done){
        chai.request(server)
          .put('/api/replies/test')
          .send({thread_id: idToReport, reply_id: replyToReport})
          .end((err,res) => {
            assert.equal(res.status, 200);
            assert.equal(res.body, 'success');
            done();
          })
      })
    });
    
    suite('DELETE', function() {
      test('DELETE reply passing incorrect password returns "incorrect password"', function(done){
        chai.request(server)
          .delete('/api/replies/test')
          .send({thread_id: idToReport, reply_id: replyToReport, delete_password: 'wrong'})//thread_id, reply_id, & delete_password
          .end((err,res) => {
            assert.equal(res.status, 200);
            assert.equal(res.body, 'incorrect password');
            done();
          })
      })
      test('DELETE reply passing correct password returns "success"', function(done){
        chai.request(server)
          .delete('/api/replies/test')
          .send({thread_id: idToReport, reply_id: replyToReport, delete_password: 'deletereply'})
          .end((err,res) => {
            assert.equal(res.status, 200);
            assert.equal(res.body, 'success');
            done();
          })
      })
    });
    
  });

});
