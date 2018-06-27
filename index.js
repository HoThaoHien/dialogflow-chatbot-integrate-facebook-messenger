const API_AI_TOKEN = '0c2fd7d8eca148709cbbcbe23843a3f7';
const FACEBOOK_ACCESS_TOKEN = 'EAACQrYT69OEBAJnYZCnBrMFdQymU3gffzI6qMsdZA5DroMddVoMl9LF7ltfN8EBLZB2xlKVEbvrqDr1yfl97KjJZBAixuQe2gRamw7a785NsqcxNUeI6aG94wNKE4tXhUtmQiMZCP614w2J6sxzqhvsDFQZBAhF0Dng7oMy88LA5YMwMFRVV5n';
const API_GOOGLE_SEARCH = 'AIzaSyD7jJn6kmRmQKIeUz-Lcs1D_z9AzkgZ9g8'
const apiAiClient = require('apiai')(API_AI_TOKEN);
const db = require('./database');

var google = require('google');
var logger = require('morgan');
var http = require('http');
var bodyParser = require('body-parser');
// var router = express();
var express = require('express');
var app = express();
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));
var server = http.createServer(app);
var request = require("request");

app.get('/', (req, res) => {
  res.send("Home page. Server running okay.");
});

// app.set('port', process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || 8080);
// server.listen(app.get('port'), function() {
//   console.log("Chat bot server listening at %d ",  app.get('port'));
// });

app.set('port', process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || 8080);
app.set('ip', process.env.OPENSHIFT_NODEJS_IP || process.env.IP || "127.0.0.1");

server.listen(app.get('port'), app.get('ip'), function() {
  console.log("Chat bot server listening at %s:%d ", app.get('ip'), app.get('port'));
});


app.get('/webhook', function(req, res) {
    const hubChallenge = req.query['hub.challenge'];
    const hubMode = req.query['hub.mode'];
    const verifyTokenMatches = (req.query['hub.verify_token'] === 'rukawa10051996');
    if (hubMode && verifyTokenMatches) {
        res.status(200).send(hubChallenge);
    } else {
        res.status(403).end();
    }
});

function sendTextMessageToUser(senderId, text) {
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: { access_token: FACEBOOK_ACCESS_TOKEN },
        method: 'POST',
        json: {
            recipient: { id: senderId },
            message: { text },
        }
    });
}

function sendPayloadToUser(senderId, attachment) {
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: { access_token: FACEBOOK_ACCESS_TOKEN },
        method: 'POST',
        json: {
            recipient: { id: senderId },
            message: { attachment },
        }
    });
}

function sendTypingActionToUser (senderId){
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: { access_token: FACEBOOK_ACCESS_TOKEN },
        method: 'POST',
        json: {
            recipient: { id: senderId },
            sender_action: "typing_on"
        }
    });
}


google.resultsPerPage = 2
function sendGoogleSearchResultToUser (senderId, userQuery){
     google( userQuery + 'site:hcmus.edu.vn ' , function (err, res){
        if (err) throw err
        if (res.links.length === 0){
            sendTextMessageToUser(senderId, 'Xin lỗi, tôi không tìm thấy câu trả lời cho câu hỏi của bạn, tôi rất lấy làm tiếc!');
        }
        else {
            sendTextMessageToUser(senderId, 'Bạn tham khảo thêm thông tin trong các link dưới này nhé.');                         
            for (i = 0; i<res.links.length; i++){
                sendTextMessageToUser(senderId, res.links[i].href);
                console.log (res.links[i].href)
            }
        }
       
    })
}

function confirmActionInfo (senderId){
    sendPayloadToUser (senderId,  {
                        "type":"template",
                        "payload":{
                            "template_type":"button",
                            "text":"MSSV: 1412169 \nĐăng kí môn học: ABC XYZ \nVui lòng xác nhận thông tin.",
                            "buttons":[
                            {
                                "type":"postback",
                                "title":"Xác nhận",
                                "payload": "Ok"
                            },
                             {
                                "type":"postback",
                                "title":"Thông tin sai",
                                "payload": "Fail"
                            }
                            ]
                        }
    })
    
}

function replaceParamValueInQuery (sqlString, paramName, paramValue){
    for (i = 0; i< paramName.length; i++){
        if (paramValue[i] === 'undefined' || paramValue[i] === ''){
            sqlString = sqlString.replace(paramName[i], null)
        }
        else {
            if (paramName[i] === 'hinh_thuc_mon_hoc'){
                if (paramValue[i] === 'bắt buộc'){
                    paramValue[i] = 1
                }
                else {
                    paramValue[i] = 2
                }
            }
            console.log (paramName[i] + '  ' + paramValue[i])
            if (isNaN(paramValue[i]) === true){
                sqlString = sqlString.replace(paramName[i], "N'%" + paramValue[i] + "%'")
            }
            else {
                sqlString = sqlString.replace(paramName[i], paramValue[i])
            }
            
        }
    }
    console.log (sqlString)
    return sqlString
}

function replaceParamValueInProcedure (sqlString, paramName, paramValue){
    for (i = 0; i< paramName.length; i++){
        if (paramValue[i] === 'undefined' || paramValue[i] === ''){
            sqlString = sqlString.replace(paramName[i], null)
        }
        else {
            console.log (paramName[i] + '  ' + paramValue[i])
            if (isNaN(paramValue[i]) === true){
                sqlString = sqlString.replace(paramName[i], "'" + paramValue[i] + "'")
            }
            else {
                sqlString = sqlString.replace(paramName[i], paramValue[i])
            }
        }
    }
    console.log (sqlString)
    return sqlString
}


function responseToUser (senderId, response) {
        //--------------------------------------------------------------------------------------
        console.log('ID LA: ', senderId)
        console.log('NGUYEN CUM LA: ', response.result)
        console.log('MESSAGE LA: ', response.result.fulfillment.messages)
        //--------------------------------------------------------------------------------------
        resolvedQuery = response.result.resolvedQuery;
        speech = response.result.fulfillment.speech;
        intentName = response.result.metadata.intentName
        param = response.result.parameters
        //--------------------------------------------------------------------------------------
        paramMessage = ''
        facebookMessage = ''
        paramMessage = response.result.fulfillment.messages[0].speech
        if (response.result.fulfillment.messages.length > 1){
            facebookMessage = response.result.fulfillment.messages[1].speech
        }
        console.log ('paramMessage: ', paramMessage)
        console.log ('facebookMessage: ', facebookMessage)
        //--------------------------------------------------------------------------------------
        var paramName = Object.keys(param).map(function(value, index) {
            value.index = index;
            return value;
        });
        var paramValue = Object.keys(param).map(function (key) {
            return param[key]; 
        })
        console.log('paramValue: ', paramValue)
        console.log('paramName: ', paramName)
        //--------------------------------------------------------------------------------------
        if (speech === ''){
            //Gửi prompt để lấy đủ tham số
            if (facebookMessage === ''){
                sendTextMessageToUser(senderId,paramMessage);
                console.log ('paramMessage: ', paramMessage)
            }
            //Gửi câu trả lời
            else {
                // console.log ('facebookMessage: ', facebookMessage)
                var sql = "select intentType, response as res from intent_response where intent = ?";
                db.query(sql, [intentName], function(err, response) {
                    if (err) throw err;
                    Object.keys(response).map(function(key) {
                        var row = response[key];
                        // console.log ('ROW', row)
                        switch (row.intentType) {
                            case 0:
                                console.log ('TRƯỜNG HỢP 0')
                                // sendTextMessageToUser(senderId, 'Trường hợp 0');
                                sendTextMessageToUser(senderId,facebookMessage);
                                break;
                            case 1:
                                console.log ('TRƯỜNG HỢP 1')
                                // searchResult = sendGoogleSearchResultToUser (senderId, resolvedQuery);
                                // sendTextMessageToUser(senderId, 'Trường hợp 1');
                                sendGoogleSearchResultToUser (senderId, resolvedQuery) 
                                setTimeout(sendTextMessageToUser, 5000, senderId, 'Bạn có muốn hỏi câu hỏi hay yêu cầu nào khác không?'); 
                                break;
                            case 2:
                                db.query(replaceParamValueInQuery(row.res, paramName, paramValue), function(err, results) {
                                    // console.log ('row response: ', row.res)
                                    // console.log ('ket qua tra ve tu db: ', results)
                                    if (err) throw err;
                                    if (results.length === 0){
                                            // console.log ('TRƯỜNG HỢP 2.1')
                                            sendGoogleSearchResultToUser (senderId, resolvedQuery)
                                            setTimeout(sendTextMessageToUser, 5000, senderId, 'Bạn có muốn hỏi câu hỏi hay yêu cầu nào khác không?'); 
                                        
                                    }
                                    else {
                                        // console.log ('TRƯỜNG HỢP 2.1')
                                        Object.keys(results).forEach(function (key) {
                                            row = results[key]
                                            var temp = Object.keys(row).map(function (key) {
                                                return row[key]; 
                                            })
                                            dbResult = ""
                                            temp.forEach(function(field){
                                                // console.log ('field:' ,field)
                                                dbResult += field + '. ';
                                            })
                                            sendTextMessageToUser(senderId, dbResult);
                                        
                                        })
                                        setTimeout(sendTextMessageToUser, 5000, senderId, 'Bạn có muốn hỏi câu hỏi hay yêu cầu nào khác không?'); 
                                    }
                                })
                                break;
                            case 3:
                                db.query(replaceParamValueInProcedure(row.res, paramName, paramValue), function(err, results) {
                                    if (err) throw err;
                                    db.query('select @result', function(err, results) {
                                        if (err) throw err;
                                        console.log (results)
                                        Object.keys(results).forEach(function (key) {
                                            row = results[key]
                                            var temp = Object.keys(row).map(function (key) {
                                                return row[key]; 
                                            })
                                            dbResult = ""
                                            temp.forEach(function(field){
                                                console.log ('field:' ,field)
                                                dbResult += field + '. ';
                                            })
                                            sendTextMessageToUser(senderId, dbResult);
                                            setTimeout(sendTextMessageToUser, 5000, senderId, 'Bạn có muốn hỏi câu hỏi hay yêu cầu nào khác không?'); 
                                        })
                                    })
                                })
                            break;
                        }
                    });   
                })
            }
        }    
}


// Xử lý tin nhắn người dùng và trả kết quả.
app.post('/webhook', function(req, res) {
  var entries = req.body.entry;
  for (var entry of entries) {
    var messaging = entry.messaging;
    for (var message of messaging) {
      var senderId = message.sender.id;
      if (message.message) {
        if (message.message.text) {
            sendTypingActionToUser(senderId)
            const apiaiSession = apiAiClient.textRequest(message.message.text, {sessionId: 'rukawa10051996'});
            apiaiSession.on('response', (response) => {
                responseToUser (senderId, response);
            });

            apiaiSession.on('error', error => console.log(error));
            apiaiSession.end();
        }
      }
    }
  }
  res.status(200).send("OK");
});