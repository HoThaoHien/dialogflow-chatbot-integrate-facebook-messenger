// const API_AI_TOKEN = '0c2fd7d8eca148709cbbcbe23843a3f7';
// const FACEBOOK_ACCESS_TOKEN = 'EAACQrYT69OEBABFZBArg65TWKAUnqlXLyNmfyF2HU9ZAE0hMwsePv6KUXyS5ZBcPFdcHwUSRdon7fLJubeL8m9SGcYKEMErnzTTuk9nYjwnxslPZA6R89wUQYuVQguMUqXsdALxQluF9FUvQNil2DQ33IXS4lKbKZBzW7IpjYZAKiGdvYiMh1S59z79uztuqcZD';
// const API_GOOGLE_SEARCH = 'AIzaSyD7jJn6kmRmQKIeUz-Lcs1D_z9AzkgZ9g8'
// const apiAiClient = require('apiai')(API_AI_TOKEN);
// // const db = require('./database');

// var google = require('google');
// var logger = require('morgan');
// var http = require('http');
// var bodyParser = require('body-parser');
// // var router = express();
// var express = require('express');
// var app = express();
// app.use(logger('dev'));
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({
//   extended: false
// }));
// var server = http.createServer(app);
// var request = require("request");

// app.get('/', (req, res) => {
//   res.send("Home page. Server running okay.");
// });

// // app.set('port', process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || 8080);
// // server.listen(app.get('port'), function() {
// //   console.log("Chat bot server listening at %d ",  app.get('port'));
// // });

// // var express = require('express');
// // var app = express();
// // var http = require('http');
// var server = http.createServer(app);

// app.set('port', process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || 8080);
// app.set('ip', process.env.OPENSHIFT_NODEJS_IP || process.env.IP || "127.0.0.1");

// server.listen(app.get('port'), app.get('ip'), function() {
//   console.log("Chat bot server listening at %s:%d ", app.get('ip'), app.get('port'));
// });


// // Tạo webhook.
// app.get('/webhook', function(req, res) {
//     const hubChallenge = req.query['hub.challenge'];
//     const hubMode = req.query['hub.mode'];
//     const verifyTokenMatches = (req.query['hub.verify_token'] === 'rukawa10051996');
//     if (hubMode && verifyTokenMatches) {
//         res.status(200).send(hubChallenge);
//     } else {
//         res.status(403).end();
//     }
// });

// // Xử lý tin nhắn người dùng và trả kết quả.
// app.post('/webhook', function(req, res) {
//   var entries = req.body.entry;
//   for (var entry of entries) {
//     var messaging = entry.messaging;
//     for (var message of messaging) {
//       var senderId = message.sender.id;
//       if (message.message) {
//         if (message.message.text) {
//             sendTypingActionToUser(senderId)
//             const apiaiSession = apiAiClient.textRequest(message.message.text, {sessionId: 'rukawa10051996'});
//             apiaiSession.on('response', (response) => {
//                 console.log(response.result)
//                 console.log(response.result.fulfillment.messages)
//                 resolvedQuery = response.result.resolvedQuery;
//                 response.result.resolvedQuery;
//                 speech = response.result.fulfillment.speech;
//                 intentName = response.result.metadata.intentName
//                 param = response.result.parameters
//                 defaultMessage = ''
//                 facebookMessage = ''
//                 defaultMessage = response.result.fulfillment.messages[0].speech
//                 if (response.result.fulfillment.messages.length > 1){
//                     facebookMessage = response.result.fulfillment.messages[1].speech
//                 }
//                 var paramName = Object.keys(param).map(function(value, index) {
//                     value.index = index;
//                     return value;
//                 });
//                 var paramValue = Object.keys(param).map(function (key) {
//                     return param[key]; 
//                 })

//                 if (speech === ''){
//                     //Send promp to get enough parameter
//                     if (facebookMessage === ''){
//                         sendTextMessageToUser(senderId,defaultMessage);
//                         console.log ('defaultMessage: ', defaultMessage)
//                     }
//                     //Send response
//                     else {
//                         sendTextMessageToUser(senderId, facebookMessage);
//                         console.log ('facebookMessage: ', facebookMessage)
//                     }
//                     responseToUser(senderId, resolvedQuery, speech, intentName, paramName, paramValue);
//                 }
//                 else {
//                     sendTextMessageToUser(senderId, speech);
//                     console.log ('speech: ', speech)
//                 }
//             });

//             apiaiSession.on('error', error => console.log(error));
//             apiaiSession.end();
//         }
//       }
//     }
//   }
//   res.status(200).send("OK");
// });



// //Gửi tin nhắn dưới dạng text đến cho người dùng.
// function sendTextMessageToUser(senderId, text) {
//     request({
//         url: 'https://graph.facebook.com/v2.6/me/messages',
//         qs: { access_token: FACEBOOK_ACCESS_TOKEN },
//         method: 'POST',
//         json: {
//             recipient: { id: senderId },
//             message: { text },
//         }
//     });
// }

// function sendPayloadToUser(senderId, attachment) {
//     request({
//         url: 'https://graph.facebook.com/v2.6/me/messages',
//         qs: { access_token: FACEBOOK_ACCESS_TOKEN },
//         method: 'POST',
//         json: {
//             recipient: { id: senderId },
//             message: { attachment },
//         }
//     });
// }

// function sendTypingActionToUser (senderId){
//     request({
//         url: 'https://graph.facebook.com/v2.6/me/messages',
//         qs: { access_token: FACEBOOK_ACCESS_TOKEN },
//         method: 'POST',
//         json: {
//             recipient: { id: senderId },
//             sender_action: "typing_on"
//         }
//     });
// }

// var google = require('google');
// google.resultsPerPage = 3
// function sendGoogleSearchResultToUser (senderId, userQuery){
//      google( userQuery + 'hcmus ' , function (err, res){
//         if (err) throw err
//         if (res.links.length === 0){
//             sendTextMessageToUser(senderId, 'Xin lỗi, không có kết quả tìm kiếm cho câu trả lời của bạn.'  
//                                             +'Tôi rất lấy làm tiếc!');
//         }
//         else {
//             for (i = 0; i<res.links.length; i++){
//                 sendTextMessageToUser(senderId, 'Bạn tham khảo nội dung trong link này nhé: ' + res.links[i].href);
//             }
           
//         }
       
//     })
// }

// function confirmActionInfo (senderId){
//     sendPayloadToUser (senderId,  {
//                         "type":"template",
//                         "payload":{
//                             "template_type":"button",
//                             "text":"MSSV: 1412169 \nĐăng kí môn học: ABC XYZ \nVui lòng xác nhận thông tin.",
//                             "buttons":[
//                             {
//                                 "type":"postback",
//                                 "title":"Xác nhận",
//                                 "payload": "Ok"
//                             },
//                              {
//                                 "type":"postback",
//                                 "title":"Thông tin sai",
//                                 "payload": "Fail"
//                             }
//                             ]
//                         }
//     })
    
// }

// function replaceParamValueInQuery (sqlString, paramName, paramValue){
//     for (i = 0; i< paramName.length; i++){
//         if (paramValue[i] === 'undefined' || paramValue[i] === ''){
//             sqlString = sqlString.replace(paramName[i], null)
//         }
//         else {
//             if (paramName[i] === 'hinh_thuc_mon_hoc'){
//                 if (paramValue[i] === 'bắt buộc'){
//                     paramValue[i] = 1
//                 }
//                 else {
//                     paramValue[i] = 2
//                 }
//             }
//             console.log (paramName[i] + '  ' + paramValue[i])
//             if (isNaN(paramValue[i]) === true){
//                 sqlString = sqlString.replace(paramName[i], "N'%" + paramValue[i] + "%'")
//             }
//             else {
//                 sqlString = sqlString.replace(paramName[i], paramValue[i])
//             }
            
//         }
//     }
//     console.log (sqlString)
//     return sqlString
// }

// function replaceParamValueInProcedure (sqlString, paramName, paramValue){
//     for (i = 0; i< paramName.length; i++){
//         if (paramValue[i] === 'undefined' || paramValue[i] === ''){
//             sqlString = sqlString.replace(paramName[i], null)
//         }
//         else {
//             console.log (paramName[i] + '  ' + paramValue[i])
//             if (isNaN(paramValue[i]) === true){
//                 sqlString = sqlString.replace(paramName[i], "'" + paramValue[i] + "'")
//             }
//             else {
//                 sqlString = sqlString.replace(paramName[i], paramValue[i])
//             }
//         }
//     }
//     console.log (sqlString)
//     return sqlString
// }


// function responseToUser (senderId, resolvedQuery, speech, intentName, paramName, paramValue) {
//         var sql = "select intentType, response as res from intent_response where intent = ?";
//         db.query(sql, [intentName], function(err, response) {
//             if (err) throw err;
//             Object.keys(response).map(function(key) {
//                 var row = response[key];
//                 //Trường hợp intent loại 1
//                 if (row.intentType === 0){
//                     console.log ('TRƯỜNG HỢP 0')
//                     sendTextMessageToUser(senderId, '');
//                 }
//                 //Trường hợp intent loại 2
//                 else if (row.intentType === 1){ 
//                     console.log ('TRƯỜNG HỢP 1')
//                     sendGoogleSearchResultToUser (senderId, resolvedQuery)
//                     setTimeout(sendTextMessageToUser, 5000, senderId, 'Bạn có muốn hỏi câu hỏi hay yêu cầu nào khác không?'); 
//                 }
//                 //Trường hợp intent loại 3
//                 else if (row.intentType === 2) {
//                     db.query(replaceParamValueInQuery(row.res, paramName, paramValue), function(err, results) {
//                         console.log ('Đây là row response ', row.res)
//                         console.log ('Ket qua tra ve tu db', results)
//                         if (err) throw err;
//                         if (results.length === 0){
//                                 console.log ('TRƯỜNG HỢP 2.1')
//                                 sendGoogleSearchResultToUser (senderId, resolvedQuery)
//                                 setTimeout(sendTextMessageToUser, 5000, senderId, 'Bạn có muốn hỏi câu hỏi hay yêu cầu nào khác không?'); 
                             
//                         }
//                         else {
//                             console.log ('TRƯỜNG HỢP 2.1')
//                             Object.keys(results).forEach(function (key) {
//                                 row = results[key]
//                                 var temp = Object.keys(row).map(function (key) {
//                                     return row[key]; 
//                                 })
//                                 dbResult = ""
//                                 temp.forEach(function(field){
//                                     console.log ('field:' ,field)
//                                     dbResult += field + '. ';
//                                 })
//                                 sendTextMessageToUser(senderId, dbResult);
                               
//                             })
//                             setTimeout(sendTextMessageToUser, 5000, senderId, 'Bạn có muốn hỏi câu hỏi hay yêu cầu nào khác không?'); 
//                         }
//                     })
//                 }   
//                 //Trường hợp intent loại 4  
//                 else {
//                    db.query(replaceParamValueInProcedure(row.res, paramName, paramValue), function(err, results) {
//                         if (err) throw err;
//                         db.query('select @result', function(err, results) {
//                             if (err) throw err;
//                             console.log (results)
//                             Object.keys(results).forEach(function (key) {
//                                 row = results[key]
//                                 var temp = Object.keys(row).map(function (key) {
//                                     return row[key]; 
//                                 })
//                                 dbResult = ""
//                                 temp.forEach(function(field){
//                                     console.log ('field:' ,field)
//                                     dbResult += field + '. ';
//                                 })
//                                 sendTextMessageToUser(senderId, dbResult);
//                                 setTimeout(sendTextMessageToUser, 5000, senderId, 'Bạn có muốn hỏi câu hỏi hay yêu cầu nào khác không?'); 
//                             })
//                         })
//                    })
//                 }
//             });   
//         })
// }

