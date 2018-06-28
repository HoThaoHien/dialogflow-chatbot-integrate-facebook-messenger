const API_AI_TOKEN = 'f6aeefd87e0747d89baa5d4e0b381a82';
const FACEBOOK_ACCESS_TOKEN = 'EAACQrYT69OEBAOn9CbTVRNUGmUVpEuI3nbHFLtZBLfnrvaz5ClyEHlZB4u8HeBR2dM7QAlTrzqugnoeSsZBJskVxUkzZCEHikZBDZCu6pzZBZCwvsdImIvGWZAMphuCPY9KIZBT0BSjt2WRLSJZAXGJwmMqkd9ixkJB2vrHBDRud4jq7qbsgup8nmPS';
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

function sendTextMessageToUserBeforeAction(senderId, text, callback) {
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: { access_token: FACEBOOK_ACCESS_TOKEN },
        method: 'POST',
        json: {
            recipient: { id: senderId },
            message: { text },
        }
    }, callback)
}

function sendTypingActionToUser (senderId, response, callback){
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: { access_token: FACEBOOK_ACCESS_TOKEN },
        method: 'POST',
        json: {
            recipient: { id: senderId },
            sender_action: "typing_on"
        }
    });
    callback(senderId, response)
}

google.resultsPerPage = 2
function sendGoogleSearchResultToUser (senderId, userQuery){
     google( userQuery + 'site:hcmus' , function (err, res){
        if (err) throw err
        if (res.links.length === 0){
            sendTextMessageToUser(senderId, 'Xin lỗi, tôi không tìm thấy câu trả lời cho câu hỏi của bạn, tôi rất lấy làm tiếc!');
        }
        else {
            sendTextMessageToUserBeforeAction(senderId, 'Bạn tham khảo thêm thông tin trong các link dưới này nhé.', function(){
                for (i = 0; i<res.links.length; i++){
                    sendTextMessageToUser(senderId, res.links[i].href);
                    console.log (res.links[i].href)
                }
            });                         
            
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
        console.log('---------------------------------------------------------------------')
        //--------------------------------------------------------------------------------------
        resolvedQuery = response.result.resolvedQuery;
        speech = response.result.fulfillment.speech;
        intentName = response.result.metadata.intentName
        param = response.result.parameters
        //--------------------------------------------------------------------------------------
        paramMessage = ''
        if (response.result.fulfillment.messages.length > 1){
            if (response.result.fulfillment.messages[0].speech){
                paramMessage = response.result.fulfillment.messages[0].speech
            }
            else {
                paramMessage = response.result.fulfillment.messages[1].speech
            }
        }
        else {
            paramMessage = response.result.fulfillment.messages[0].speech
        }
        //--------------------------------------------------------------------------------------
        var paramName = Object.keys(param).map(function(value, index) {
            value.index = index;
            return value;
        });
        var paramValue = Object.keys(param).map(function (key) {
            return param[key]; 
        })
        //--------------------------------------------------------------------------------------
        if (speech === ''){
            //Gửi prompt để lấy đủ tham số
            // if (paramMessage === ''){
            //     console.log ('TRƯỜNG HỢP SPEECH RỖNG')
            //     sendTextMessageToUser(senderId,paramMessage);
            //     console.log ('paramMessage: ', paramMessage)
            // }
            //Gửi câu trả lời
            // else {
                var sql = "select intentType, response as res from intent_response where intent = ?";
                db.query(sql, [intentName], function(err, sqlResponse) {
                    if (err) throw err;
                    Object.keys(sqlResponse).map(function(key) {
                        var row = sqlResponse[key];
                        sendTextMessageToUserBeforeAction(senderId,paramMessage, function(){
                            console.log ('VAO DAY ROI NHA')
                            switch (row.intentType) {
                                //----------------------------------------------------
                                case 1:
                                    console.log ('TRƯỜNG HỢP 1')
                                    sendGoogleSearchResultToUser (senderId, resolvedQuery) 
                                    setTimeout(sendTextMessageToUser, 50000, senderId, 'Bạn có muốn hỏi câu hỏi hay yêu cầu nào khác không?'); 
                                    break;
                                //------------------------------------------------------
                                case 2:
                                    db.query(replaceParamValueInQuery(row.res, paramName, paramValue), function(err, results) {
                                        console.log ('row response: ', row.res)
                                        console.log ('ket qua tra ve tu db: ', results)
                                        if (err) throw err;
                                        if (results.length === 0){
                                                console.log ('TRƯỜNG HỢP 2.1')
                                                sendGoogleSearchResultToUser (senderId, resolvedQuery)
                                                setTimeout(sendTextMessageToUser, 50000, senderId, 'Bạn có muốn hỏi câu hỏi hay yêu cầu nào khác không?'); 
                                            
                                        }
                                        else {
                                            console.log ('TRƯỜNG HỢP 2.2')
                                            Object.keys(results).forEach(function (key) {
                                                row = results[key]
                                                var temp = Object.keys(row).map(function (key) {
                                                    return row[key]; 
                                                })
                                                dbResult = ""
                                                temp.forEach(function(field){
                                                    dbResult += field + '. ';
                                                })
                                                sendTextMessageToUser(senderId, dbResult);
                                            
                                            })
                                            setTimeout(sendTextMessageToUser, 50000, senderId, 'Bạn có muốn hỏi câu hỏi hay yêu cầu nào khác không?'); 
                                        }
                                    })
                                    break;
                                case 3: 
                                    confirmActionInfo(senderId,response.result.parameters['ma_so_sinh_vien'],response.result.parameters['ten_mon_hoc'])
                            }
                        });
                        
                    });   
                })
            // }
        }    
        else {
            console.log("TRƯỜNG HỢP 0")
            sendTextMessageToUser(senderId,paramMessage);
        }
}

function doAction (senderId, paramName, paramValue, payload){
    if (payload === 'Ok'){
        actionIsCompleted = true
        var sql = "select response as res from intent_response where intent = ?";
        db.query(sql, [intentName], function(err, response) {
            if (err) throw err;
            Object.keys(response).map(function(key) {
                var row = response[key];
                console.log ('TRƯỜNG HỢP 3')
                db.query(replaceParamValueInProcedure(row.res, paramName, paramValue), function(err, results) {
                    console.log ('row response: ', response)
                    console.log ('ket qua tra ve tu db: ', results)
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
                            setTimeout(sendTextMessageToUser, 50000, senderId, 'Bạn có muốn hỏi câu hỏi hay yêu cầu nào khác không?'); 
                        })
                    })
                })
            });   
        })
    }
    else if (payload === 'wrongStudentId') {
        actionIsCompleted = false
        sendTextMessageToUser(senderId, 'Mã số sinh viên đúng của bạn là gì?');
        // confirmActionInfo(senderId,response.result.parameters['ma_so_sinh_vien'],response.result.parameters['ten_mon_hoc'])

    }
    else {
        actionIsCompleted = false
        sendTextMessageToUser(senderId, 'Bạn vui lòng cho mình biết tên môn học chính xác. (Ví dụ: Cơ sở dữ liệu)');
        // confirmActionInfo(senderId,response.result.parameters['ma_so_sinh_vien'],response.result.parameters['ten_mon_hoc'])
    }

    
}

// Xử lý tin nhắn người dùng và trả kết quả.
var paramName = {}
var paramValue = {}
var param = {}
var studentId = ''
var subject = ''
var actionIsCompleted = true
var payload = 'Ok'


app.post('/webhook', function(req, res) {
    console.log ("Vo day chua?")
    var entries = req.body.entry;
    for (var entry of entries) {
        var messaging = entry.messaging;
        for (var message of messaging) {
            var senderId = message.sender.id;
            if (message.message) {
                if (message.message.text) {
                    if (actionIsCompleted){
                        const apiaiSession = apiAiClient.textRequest(message.message.text, {sessionId: 'rukawa10051996'});
                        apiaiSession.on('response', (response) => {
                            param = response.result.parameters
                            studentId = param['ma_so_sinh_vien']
                            subject = param['ten_mon_hoc']
                            paramName = Object.keys(param).map(function(value, index) {
                                value.index = index;
                                return value;
                            });
                            paramValue = Object.keys(param).map(function (key) {
                                return param[key]; 
                            })
                            console.log(param)
                            console.log ('paramName:  ', paramName)
                            console.log ('paramValue:  ', paramValue)
                            sendTypingActionToUser(senderId, response, responseToUser)
                        });
                        apiaiSession.on('error', error => console.log(error));
                        apiaiSession.end();
                    }
                    else {
                        if (payload === 'wrongStudentId'){
                            studentId = message.message.text
                            confirmActionInfo(senderId, message.message.text , param['ten_mon_hoc'])
                        }
                        else {
                            subject = message.message.text
                            confirmActionInfo(senderId, param['ma_so_sinh_vien'], message.message.text)
                        }
                    }
                        
                }
            }
            else if (message.postback && message.postback.payload) {
                payload = message.postback.payload;
                if (!actionIsCompleted){
                    paramValue[paramName.indexOf('ma_so_sinh_vien')] = studentId
                    paramValue[paramName.indexOf('ten_mon_hoc')] = subject
                }
                doAction(senderId, paramName, paramValue, message.postback.payload)
            }
        }
    }
  res.status(200).send("OK");
});


function confirmActionInfo (senderId, studentId, subject){
    sendPayloadToUser (senderId,  {
                        "type":"template",
                        "payload":{
                            "template_type":"button",
                            "text":"Bạn kiểm tra thông tin đúng không nhé" + "\nMSSV: " + studentId + "\nTên môn học:" + subject,
                            "buttons":[
                            {
                                "type":"postback",
                                "title":"Đúng thông tin",
                                "payload": "Ok"
                            },
                             {
                                "type":"postback",
                                "title":"Sai MSSV",
                                "payload": "wrongStudentId"
                            },
                            {
                                "type":"postback",
                                "title":"Sai tên môn học",
                                "payload": "wrongSubject"
                            }
                            ]
                        }
    })
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

// app.set('port', process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || 8080);
// server.listen(app.get('port'), function() {
//   console.log("Chat bot server listening at %d ",  app.get('port'));
// });