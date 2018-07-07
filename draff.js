const API_AI_TOKEN = '92ae63ad09444f4bb3cd7342b5326e3f';
const FACEBOOK_ACCESS_TOKEN = 'EAACQrYT69OEBAOn9CbTVRNUGmUVpEuI3nbHFLtZBLfnrvaz5ClyEHlZB4u8HeBR2dM7QAlTrzqugnoeSsZBJskVxUkzZCEHikZBDZCu6pzZBZCwvsdImIvGWZAMphuCPY9KIZBT0BSjt2WRLSJZAXGJwmMqkd9ixkJB2vrHBDRud4jq7qbsgup8nmPS';
const apiAiClient = require('apiai')(API_AI_TOKEN);
const db = require('./database');

var google = require('google');
var logger = require('morgan');
var http = require('http');
var bodyParser = require('body-parser');
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

server.listen(app.get('port'), app.get('ip'), function () {
    console.log("Chat bot server listening at %s:%d ", app.get('ip'), app.get('port'));
});

// Xử lý tin nhắn người dùng và trả kết quả.
var paramName = {}
var paramValue = {}
var param = {}
var studentId = ''
var subject = ''
var actionIsCompleted = true
var payload = 'Ok'
intentName

app.get('/webhook', function (req, res) {
    const hubChallenge = req.query['hub.challenge'];
    const hubMode = req.query['hub.mode'];
    const verifyTokenMatches = (req.query['hub.verify_token'] === 'rukawa10051996');
    if (hubMode && verifyTokenMatches) {
        res.status(200).send(hubChallenge);
    } else {
        res.status(403).end();
    }
});

app.post('/webhook', function (req, res) {
    console.log("Vo day chua?")
    var entries = req.body.entry;
    for (var entry of entries) {
        var messaging = entry.messaging;
        for (var message of messaging) {
            var senderId = message.sender.id;
            if (message.message) {
                if (message.message.text) {
                    if (actionIsCompleted) {
                        const apiaiSession = apiAiClient.textRequest(message.message.text, {
                            sessionId: 'rukawa10051996'
                        });
                        apiaiSession.on('response', (response) => {
                            param = response.result.parameters
                            studentId = param['ma_so_sinh_vien']
                            subject = param['ten_mon_hoc']
                            paramName = Object.keys(param).map(function (value, index) {
                                value.index = index;
                                return value;
                            });
                            paramValue = Object.keys(param).map(function (key) {
                                return param[key];
                            })
                            console.log(param)
                            console.log('paramName:  ', paramName)
                            console.log('paramValue:  ', paramValue)
                            sendTypingActionToUser(senderId, response, responseToUser)
                        });
                        apiaiSession.on('error', error => console.log(error));
                        apiaiSession.end();
                    } else {
                        if (payload === 'wrongStudentId') {
                            studentId = message.message.text
                            param['ma_so_sinh_vien'] = message.message.text
                            confirmActionInfo(senderId, message.message.text, param['ten_mon_hoc'])
                        } else {
                            subject = message.message.text
                            confirmActionInfo(senderId, param['ma_so_sinh_vien'], message.message.text)
                        }
                    }

                }
            } else if (message.postback && message.postback.payload) {
                payload = message.postback.payload;
                if (!actionIsCompleted) {
                    paramValue[paramName.indexOf('ma_so_sinh_vien')] = studentId
                    paramValue[paramName.indexOf('ten_mon_hoc')] = subject
                }
                checkMustFinishSubject(senderId, paramName, paramValue, payload)
                // doAction(senderId, paramName, paramValue, message.postback.payload)

                if (payload )
            }
        }
    }
    res.status(200).send("OK");
});

function sendTextMessageToUser(senderId, text) {
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {
            access_token: FACEBOOK_ACCESS_TOKEN
        },
        method: 'POST',
        json: {
            recipient: {
                id: senderId
            },
            message: {
                text
            },
        }
    });
}

function sendTextMessageToUserBeforeAction(senderId, text, callback) {
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {
            access_token: FACEBOOK_ACCESS_TOKEN
        },
        method: 'POST',
        json: {
            recipient: {
                id: senderId
            },
            message: {
                text
            },
        }
    }, callback)
}

function sendTypingActionToUser(senderId, response, callback) {
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {
            access_token: FACEBOOK_ACCESS_TOKEN
        },
        method: 'POST',
        json: {
            recipient: {
                id: senderId
            },
            sender_action: "typing_on"
        }
    });
    callback(senderId, response)
}

function sendPayloadToUser(senderId, attachment) {
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {
            access_token: FACEBOOK_ACCESS_TOKEN
        },
        method: 'POST',
        json: {
            recipient: {
                id: senderId
            },
            message: {
                attachment
            },
        }
    });
}

function sendPayloadToUserBeforeAction(senderId, attachment, callback) {
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {
            access_token: FACEBOOK_ACCESS_TOKEN
        },
        method: 'POST',
        json: {
            recipient: {
                id: senderId
            },
            message: {
                attachment
            },
        }
    }, callback);
}

google.resultsPerPage = 1
google.timeSpan = 'm'

function confirmActionInfo(senderId, studentId, subject) {
    sendPayloadToUser(senderId, {
        "type": "template",
        "payload": {
            "template_type": "button",
            "text": "Bạn kiểm tra thông tin đúng không nhé" + "\nMSSV: " + studentId + "\nTên môn học: " + subject,
            "buttons": [{
                    "type": "postback",
                    "title": "Đúng thông tin",
                    "payload": "Ok"
                },
                {
                    "type": "postback",
                    "title": "Sai MSSV",
                    "payload": "wrongStudentId"
                },
                {
                    "type": "postback",
                    "title": "Sai tên môn học",
                    "payload": "wrongSubject"
                }
            ]
        }
    })
}

function sendDashboardList (senderId){
    sendPayloadToUserBeforeAction(senderId, {
            "type":"template",
            "payload":{
              "template_type":"generic",
              "elements":[
                 {
                  "title":"Thông tin về môn học",
                  "subtitle":"Những thông tin về môn học cần học trước, môn học tương đương hay nội dung môn học.",
                  "buttons":[
                    {
                        "type": "postback",
                        "title": "Môn học tiên quyết",
                        "payload": "mon_hoc_truoc"
                    },
                    {
                        "type": "postback",
                        "title": "Môn học tương đương",
                        "payload": "mon_hoc_thay_the"
                    },
                    {
                        "type": "postback",
                        "title": "Nội dung môn học",
                        "payload": "noi_dung_mon_hoc"
                    }
                  ]      
                },

                {
                    "title":"Thông tin về chuyên ngành",
                    "subtitle":"Những thông tin về các ngành học của khoa hoặc những môn bắt buộc/tự chọn của chuyên ngành mà bạn theo học.",
                    "buttons":[
                      {
                          "type": "postback",
                          "title": "Ngành học",
                          "payload": "so_luong_mon_hoc_chuyen_nganh"
                      },
                      {
                          "type": "postback",
                          "title": "Môn học của ngành học",
                          "payload": "so_luong_chuyen_nganh"
                      }
                    ]      
                  }
              ]
            }
          }, function() {sendTextMessageToUser(senderId, 'Ngoài ra mình còn có thể giúp bạn đăng ký môn học và tìm kiếm các thông tin như kết quả thi, lịch thi, thời khóa biểu, học bổng, tài liệu môn học, thông tin tốt nghiệp và bài tập.')}) 
}


function replaceParamValueInQuery(sqlString, paramName, paramValue) {
    for (i = 0; i < paramName.length; i++) {
        if (paramValue[i] === 'undefined' || paramValue[i] === '') {
            sqlString = sqlString.replace(paramName[i], null)
        } else {
            if (paramName[i] === 'hinh_thuc_mon_hoc') {
                if (paramValue[i] === 'bắt buộc') {
                    paramValue[i] = 1
                } else {
                    paramValue[i] = 2
                }
            }
            console.log(paramName[i] + '  ' + paramValue[i])
            if (isNaN(paramValue[i]) === true) {
                sqlString = sqlString.replace(paramName[i], "N'%" + paramValue[i] + "%'")
            } else {
                sqlString = sqlString.replace(paramName[i], paramValue[i])
            }

        }
    }
    console.log(sqlString)
    return sqlString
}

function replaceParamValueInProcedure(sqlString, paramName, paramValue) {
    for (i = 0; i < paramName.length; i++) {
        if (paramValue[i] === 'undefined' || paramValue[i] === '') {
            sqlString = sqlString.replace(paramName[i], null)
        } else {
            console.log(paramName[i] + '  ' + paramValue[i])
            if (isNaN(paramValue[i]) === true) {
                sqlString = sqlString.replace(paramName[i], "'" + paramValue[i] + "'")
            } else {
                sqlString = sqlString.replace(paramName[i], paramValue[i])
            }
        }
    }
    console.log(sqlString)
    return sqlString
}

function sendGoogleSearchWithQueryToUser(senderId, keyWords) {
    console.log (keyWords)
    google(keyWords, function (err, res) {
        if (err) throw err
        if (res.links.length === 0) {
            sendTextMessageToUser(senderId, 'Xin lỗi, tôi không tìm thấy câu trả lời cho câu hỏi của bạn, tôi rất lấy làm tiếc!');
        } else {
            for (i = 0; i < res.links.length; i++) {
                sendTextMessageToUser(senderId, res.links[i].href);
                console.log(res.links[i])
            }
        }

    })
}


async function sendGoogleSearchWithParamValueToUser(senderId, paramValue) {
    keyWords = ''
    await paramValue.forEach(function (value) {
        if (value !== '') {
            keyWords += value + ' '
        }
    });
    console.log(keyWords)
    if (keyWords !== '') {
        google(keyWords + ' site:hcmus.edu.vn', function (err, res) {
            if (err) throw err
            if (res.links.length === 0) {
                sendTextMessageToUser(senderId, 'Xin lỗi, tôi không tìm thấy câu trả lời cho câu hỏi của bạn, tôi rất lấy làm tiếc!');
            } else {
                for (i = 0; i < res.links.length; i++) {
                    sendTextMessageToUser(senderId, res.links[i].href);
                    console.log(res.links[i])
                }
            }

        })
    }
}

function responseToUser(senderId, response) {
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
    if (response.result.fulfillment.messages.length > 1) {
        if (response.result.fulfillment.messages[0].speech) {
            paramMessage = response.result.fulfillment.messages[0].speech
        } else {
            paramMessage = response.result.fulfillment.messages[1].speech
        }
    } else {
        paramMessage = response.result.fulfillment.messages[0].speech
    }
    //--------------------------------------------------------------------------------------
    var paramName = Object.keys(param).map(function (value, index) {
        value.index = index;
        return value;
    });
    var paramValue = Object.keys(param).map(function (key) {
        return param[key];
    })
    //--------------------------------------------------------------------------------------
    if (speech === '') {
        var sql = "select intentType, response as res from intent_response where intent = ?";
        db.query(sql, [intentName], function (err, sqlResponse) {
            if (err) throw err;
            Object.keys(sqlResponse).map(function (key) {
                var row = sqlResponse[key];
                sendTextMessageToUserBeforeAction(senderId, paramMessage, function () {
                    console.log('VAO DAY ROI NHA')
                    switch (row.intentType) {
                        //----------------------------------------------------
                        case 1:
                            if (intentName === 'chao_hoi'){
                                console.log ('intent Name lúc này là :  ', intentName, senderId);
                                sendDashboardList(senderId)
                            }
                            break
                        case 2:
                            console.log('TRƯỜNG HỢP 2')
                            sendGoogleSearchWithParamValueToUser(senderId, paramValue)
                            sendGoogleSearchWithQueryToUser(senderId, resolvedQuery + ' site:hcmus.edu.vn')
                            break;
                            //------------------------------------------------------
                        case 3:
                            console.log('TRƯỜNG HỢP 3')
                            sendGoogleSearchWithParamValueToUser(senderId, paramValue)
                            sendGoogleSearchWithQueryToUser(senderId, resolvedQuery)
                            // setTimeout(sendTextMessageToUser, 50000, senderId, 'Bạn có muốn hỏi câu hỏi hay yêu cầu nào khác không?'); 
                            break;
                        case 4:
                            db.query(replaceParamValueInQuery(row.res, paramName, paramValue), function (err, results) {
                                console.log('row response: ', row.res)
                                console.log('ket qua tra ve tu db: ', results)
                                if (err) throw err;
                                if (results.length === 0) {
                                    console.log('TRƯỜNG HỢP 4.1 - KO CO KQ')
                                    sendTextMessageToUser(senderId, 'Xin lỗi nhưng hiện tại hệ thống chưa có thông tin bạn cần tìm kiếm.');

                                } else {
                                    console.log('TRƯỜNG HỢP 4.2 - CO KET QUA')
                                    Object.keys(results).forEach(function (key) {
                                        row = results[key]
                                        var temp = Object.keys(row).map(function (key) {
                                            return row[key];
                                        })
                                        dbResult = ""
                                        temp.forEach(function (field) {
                                            dbResult += field + '. ';
                                        })
                                        sendTextMessageToUser(senderId, dbResult);

                                    })
                                }
                            })
                            break;
                        // case 5:
                            // confirmActionInfo(senderId, response.result.parameters['ma_so_sinh_vien'], response.result.parameters['ten_mon_hoc'])
                    }
                });

            });
        })
    } else {
        console.log("TRƯỜNG HỢP 1")
        if (intentName === 'chao_hoi'){
            console.log ('intent Name lúc này là :  ', intenName);
            sendDashboardList(senderId)
        }
        else{
            sendTextMessageToUser(senderId, paramMessage);
        }
    }
}

function doAction(senderId, paramName, paramValue, payload) {
    //Thực hiện hành động
    console.log ('payload ở đây: ', payload)
    if (payload === 'Ok') {
        // checkMustFinishSubject(senderId)
        if (actionIsCompleted === false){
            var sql = "select response as res from intent_response where intent = ?";
            db.query(sql, [intentName], function (err, response) {
                if (err) throw err;
                Object.keys(response).map(function (key) {
                    var row = response[key];
                    console.log('TRƯỜNG HỢP 5')
                    //thực hiện hành động
                    db.query(replaceParamValueInProcedure(row.res, paramName, paramValue), function (err, results) {
                        console.log('row.res', row.res)
                        console.log('row response: ', response)
                        console.log('ket qua tra ve tu db: ', results)
                        if (err) throw err;
                        db.query('select @result', function (err, results) {
                            if (err) throw err;
                            console.log(results)
                            Object.keys(results).forEach(function (key) {
                                row = results[key]
                                var temp = Object.keys(row).map(function (key) {
                                    return row[key];
                                })
                                dbResult = ""
                                temp.forEach(function (field) {
                                    console.log('field:', field)
                                    dbResult += field + ' ';
                                })
                                sendTextMessageToUser(senderId, dbResult);
                            })
                        })
                    })
                });
            })
        }
        actionIsCompleted = true
        previousSubject = subject
    }
    //Hỏi lại mã số sinh viên
    else if (payload === 'wrongStudentId') {
        actionIsCompleted = false
        sendTextMessageToUser(senderId, 'Mã số sinh viên đúng của bạn là gì?');
    }
    //Hỏi lại tên môn học
    else if (payload === 'wrongSubject') {
        actionIsCompleted = false
        sendTextMessageToUser(senderId, 'Bạn vui lòng cho mình biết tên môn học chính xác. (Ví dụ: Cơ sở dữ liệu)');
    }
}

function checkMustFinishSubject(senderId, paramName, paramValue, payload){
    console.log('vô đây')
    sql = "select mht.monhoctruoc from monhoctruoc as mht where mht.monhoc = (select mh.id from monhoc as mh where mh.tenmonhoc like ?) and mht.monhoctruoc not in (select monhoc from sinhvien_monhoc where sinhvien = ?)"
    db.query(sql,[subject, studentId], function (err, sqlResponseRegistedSubject) {
        if (err) throw err;
        if (sqlResponseRegistedSubject.length === 0){
            console.log('vô đây 1')
            actionIsCompleted = false
            doAction(senderId,paramName, paramValue, payload)
        }
        else {
            console.log('vô đây 2')
            Object.keys(sqlResponseRegistedSubject).map(function (key) {
                var rowRegistedSubject = sqlResponseRegistedSubject[key];
                Object.keys(sqlResponseRegistedSubject).forEach(function (key) {
                    rowRegistedSubject = sqlResponseRegistedSubject[key]
                    var temp = Object.keys(rowRegistedSubject).map(function (key) {
                        return rowRegistedSubject[key];
                    })
                    dbResult = ""
                    sendTextMessageToUserBeforeAction(senderId, 'Bạn cần phải học môn sau đây trước khi đăng ký được môn này', function (){
                        temp.forEach(function (field) {
                            //voi moi
                            console.log ('field: ', field)
                            sql = "	select mh.tenmonhoc from monhoc as mh where mh.id = ?"
                            db.query(sql,[field], function (err, sqlResponseMustFinishSubject) {
                                if (err) throw err;
                                Object.keys(sqlResponseMustFinishSubject).map(function (key) {
                                    var rowMustFinishSubject = sqlResponseMustFinishSubject[key];
                                    Object.keys(rowMustFinishSubject).forEach(function (key) {
                                        rowMustFinishSubject = rowMustFinishSubject[key]
                                        var temp = Object.keys(rowMustFinishSubject).map(function (key) {
                                            return rowMustFinishSubject[key];
                                        })
                                        dbResult = ""
                                        temp.forEach(function (field) {
                                            dbResult += field;
                                            console.log(field)
                                        })
                                        
                                        sendTextMessageToUser(senderId, dbResult);
        
                                    })
                                })
                            })
                        })
                    })
                   
                })
            })
        }

    })




    





}

// app.set('port', process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || 8080);
// server.listen(app.get('port'), function() {
//   console.log("Chat bot server listening at %d ",  app.get('port'));
// });