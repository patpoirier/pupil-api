var crypto = require('crypto');
var express = require('express');
var bodyParser = require('body-parser');
var pkg = require('./package');

var app = express();
app.use(bodyParser.json());

var MongoClient = require('mongodb').MongoClient;

// Connection URL
if (process.env.MONGODB_URL){
  url = process.env.MONGODB_URL;
} else if (process.env.PUPILAPI_MODGODB_1_PORT_27017_TCP_ADDR){
  url = [
    'mongodb://',
    process.env.PUPILAPI_MODGODB_1_PORT_27017_TCP_ADDR,
    ':',
    process.env.PUPILAPI_MODGODB_1_PORT_27017_TCP_PORT,
    '/pupil'
  ].join('');
} else {
  url = 'mongodb://localhost:27017/pupil';
}

app.get('/', (req, res) => {
  res.json({
    online: true,
    version: pkg.version
  })
});


app.get('/conversations/:id', (req, res) => {
  MongoClient.connect(url, function(err, db) {

    var participants = req.params.id.split('.');
    var messages = db.collection('messages');

    messages.find({
      sender: {
        $in: participants
      },
      recipient: {
        $in: participants
      }
    }).sort({ created: 1 }).toArray((error, messages) => {
      if (error) {
        console.log('error:', error);
        return res.status(500).json({
          error: 'There was a server error'
        })
      }

      console.log('messages:', messages);
      db.close();

      return res.json({
        messages: messages
      })
    })
  });
})

app.post('/messages', (req, res) => {
  var message = req.body;

  console.log('received:', message);
  MongoClient.connect(url, function(err, db) {
    var messages = db.collection('messages');
    messages.insert(message, (error, result) => {
      if (error){
        console.log('error:', error);
        return res.status(500).json({
          error: 'There was a server error'
        })
      }

      console.log(result)
      db.close();

      return res.json({
        ok: true
      })
    })
  });
})

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
