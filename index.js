const API_AI_TOKEN = 'YOUR_DIALOG_FLOW_TOKEN';
const FACEBOOK_ACCESS_TOKEN = 'YOUR_FACEBOOK_PAGE_ACCESS_TOKEN';
const apiAiClient = require('apiai')(API_AI_TOKEN);
const db = require('./database');

var fs = require('fs');
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

// Global variable
var paramName = {}
var paramValue = {}
var param = {}
var studentId = ''
var subject = ''
var actionIsCompleted = true
var payload = 'Ok'
var rootLink_LICH_THI_KET_QUA_THI = 'http://ktdbcl.hcmus.edu.vn/index.php/component/search/?searchword=KEYWORD&ordering=newest&searchphrase=all&limit=10'
var rootLink_THOI_KHOA_BIEU_HOC_BONG_TOT_NGHIEP = 'https://www.hcmus.edu.vn/component/search/?searchword=KEYWORD&ordering=newest&searchphrase=all&limit=10'


app.get('/webhook', function (req, res) {
    const hubChallenge = req.query['hub.challenge'];
    const hubMode = req.query['hub.mode'];
    const verifyTokenMatches = (req.query['hub.verify_token'] === 'FACEBOOK_VERIFY_TOKEN');
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
            // If the event send to webhook is a text message
            if (message.message) {
                if (message.message.text) {
                    if (actionIsCompleted) {
                        // Send text message to Dialogflow to analyze
                        const apiaiSession = apiAiClient.textRequest(message.message.text, {
                            sessionId: 'rukawa10051996'
                        });
                        // Get response from Dialogflow and process
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
            } 
            // If the event sent to webhook is a payload
            else if (message.postback && message.postback.payload) {
                payload = message.postback.payload;
                if (!actionIsCompleted) {
                    paramValue[paramName.indexOf('ma_so_sinh_vien')] = studentId
                    paramValue[paramName.indexOf('ten_mon_hoc')] = subject
                }
                checkMustFinishSubject(senderId, paramName, paramValue, payload)

            }
        }
    }
    res.status(200).send("OK");
});

//Send text message to user without callback
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

// Send text messsage with callback
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

// Send typing action to user
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

// Send payload to user
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



// Send payload to confirm register action
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

// Replace sympolic parameter in the query with real parameter get from Dialogflow
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

// Replace sympolic parameter in the procedure with real parameter get from Dialogflow
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


google.resultsPerPage = 1
google.timeSpan = ''

// Using user sentence as a keyword to search on Google
function sendGoogleSearchWithQueryToUser(senderId, keyWords) {
    console.log(keyWords)
    google(keyWords, function (err, res) {
        if (err) throw err
        if (res.links.length === 0) {
            sendTextMessageToUser(senderId, '');
        } else {
            for (i = 0; i < res.links.length; i++) {
                sendTextMessageToUser(senderId, res.links[i].href);
                console.log(res.links[i])
            }
        }

    })
}

// Linking param values get from Dialogflow and using this as a keyword to search 
async function sendGoogleSearchWithParamValueToUser(senderId, paramValue) {
    keyWords = ''
    await paramValue.forEach(function (value) {
        if (value !== '') {
            keyWords += value + ' '
        }
    });
    console.log(keyWords)
    if (keyWords !== '') {
        google(keyWords + ' khtn', function (err, res) {
            if (err) throw err
            if (res.links.length === 0) {
                sendTextMessageToUser(senderId, '');
            } else {
                for (i = 0; i < res.links.length; i++) {
                    sendTextMessageToUser(senderId, res.links[i].href);
                    console.log(res.links[i])
                }
            }

        })
    }
}

// Case 1: return fixed  answers get from Dialogflow
// Case 2: return searched results get from fixed website
// Case 3: return searched result get from G
// Case 4: return answers from DB
// Case 5: do an action (register action)
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
                            if (intentName === 'chao_hoi') {
                                console.log('intent Name lúc này là :  ', intentName, senderId);
                                sendTextMessageToUser(senderId, 'Hiện tại các nội dung mà mình có thể hỗ trợ là: \n- Đăng ký môn học \n- Tìm môn hay tiên quyết/tương đương cho một môn học. \n- Môn học tự chọn/chuyên ngành của một chuyên ngành \n- Cho biết nội dung môn học \n- Hỗ trợ tìm kiếm các thông tin khác về lịch thi, kết quả thi, thời khóa biểu, học bổng, tài liệu môn học và bài tập.')
                            }
                            break
                        case 2:
                            console.log('TRƯỜNG HỢP 2')
                            if (intentName === 'lich_thi'  || intentName === 'ket_qua_thi'){
                                sendSearchResult(rootLink_LICH_THI_KET_QUA_THI,senderId, paramValue, 'http://ktdbcl.hcmus.edu.vn/','%20', /attachments\/article\/((.*?))>/gi)
                            }
                            if (intentName === 'thoi_khoa_bieu' || intentName === 'hoc_bong' || intentName === 'tot_nghiep'){
                                sendSearchResult(rootLink_THOI_KHOA_BIEU_HOC_BONG_TOT_NGHIEP,senderId, paramValue, 'https://www.hcmus.edu.vn/','%20', /component\/sppagebuilder\/((.*?))>/gi)
                            }
                            setTimeout(sendTextMessageToUser, 10000, senderId, 'Bạn có muốn hỏi câu hỏi hay yêu cầu nào khác không?');
                            break;
                            //------------------------------------------------------
                        case 3:
                            console.log('TRƯỜNG HỢP 3')
                            sendGoogleSearchWithParamValueToUser(senderId, paramValue)
                            sendGoogleSearchWithQueryToUser(senderId, resolvedQuery)
                            setTimeout(sendTextMessageToUser, 10000, senderId, 'Bạn có muốn hỏi câu hỏi hay yêu cầu nào khác không?');
                            break;
                        case 4:
                            db.query(replaceParamValueInQuery(row.res, paramName, paramValue), function (err, results) {
                                console.log('row response: ', row.res)
                                console.log('ket qua tra ve tu db: ', results)
                                if (err) throw err;
                                if (results.length === 0) {
                                    console.log('TRƯỜNG HỢP 4.1 - KO CO KQ')
                                    sendTextMessageToUser(senderId, 'Xin lỗi nhưng hiện tại hệ thống chưa có thông tin bạn cần tìm kiếm.');
                                    setTimeout(sendTextMessageToUser, 10000, senderId, 'Bạn có muốn hỏi câu hỏi hay yêu cầu nào khác không?');

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
                                    setTimeout(sendTextMessageToUser, 10000, senderId, 'Bạn có muốn hỏi câu hỏi hay yêu cầu nào khác không?');
                                }
                            })
                            break;
                        case 5:
                            confirmActionInfo(senderId, response.result.parameters['ma_so_sinh_vien'], response.result.parameters['ten_mon_hoc'])
                    }
                });

            });
        })
    } else {
        console.log("TRƯỜNG HỢP 1")
        if (intentName === 'chao_hoi') {
            console.log('intent Name lúc này là :  ', intenName);
            sendDashboardList(senderId)
        } else {
            sendTextMessageToUser(senderId, paramMessage);
        }
    }
}

// Do an action (register action)
function doAction(senderId, paramName, paramValue, payload) {
    if (payload === 'Ok') {
        if (actionIsCompleted === false) {
            var sql = "select response as res from intent_response where intent = ?";
            db.query(sql, [intentName], function (err, response) {
                if (err) throw err;
                Object.keys(response).map(function (key) {
                    var row = response[key];
                    console.log('TRƯỜNG HỢP 5')
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
    // Asking thstudent ID
    else if (payload === 'wrongStudentId') {
        actionIsCompleted = false
        sendTextMessageToUser(senderId, 'Mã số sinh viên đúng của bạn là gì?');
    }
    //Asking the subject
    else if (payload === 'wrongSubject') {
        actionIsCompleted = false
        sendTextMessageToUser(senderId, 'Bạn vui lòng cho mình biết tên môn học chính xác. (Ví dụ: Cơ sở dữ liệu)');
    }
}

// Checking if a student finished prerequisite subjects before registering a new subject
function checkMustFinishSubject(senderId, paramName, paramValue, payload) {
    console.log('vô đây')
    sql = "select mht.monhoctruoc from monhoctruoc as mht where mht.monhoc = (select mh.id from monhoc as mh where mh.tenmonhoc like ?) and mht.monhoctruoc not in (select monhoc from sinhvien_monhoc where sinhvien = ?)"
    db.query(sql, [subject, studentId], function (err, sqlResponseRegistedSubject) {
        if (err) throw err;
        if (sqlResponseRegistedSubject.length === 0) {
            console.log('vô đây 1')
            actionIsCompleted = false
            doAction(senderId, paramName, paramValue, payload)
        } else {
            console.log('vô đây 2')

            Object.keys(sqlResponseRegistedSubject).map(function (key) {
                var rowRegistedSubject = sqlResponseRegistedSubject[key];
                sendTextMessageToUserBeforeAction(senderId, 'Bạn cần phải học môn sau đây trước khi đăng ký được môn này', function () {
                    Object.keys(sqlResponseRegistedSubject).forEach(function (key) {
                        rowRegistedSubject = sqlResponseRegistedSubject[key]
                        var temp = Object.keys(rowRegistedSubject).map(function (key) {
                            return rowRegistedSubject[key];
                        })
                        dbResult = ""

                        temp.forEach(function (field) {
                            //voi moi
                            console.log('field: ', field)
                            sql = "	select mh.tenmonhoc from monhoc as mh where mh.id = ?"
                            db.query(sql, [field], function (err, sqlResponseMustFinishSubject) {
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

// Sending search results from fixed websites
async function sendSearchResult(rootLink, senderId, paramValue, host, replaceSpaceCharacter, regrex) {
    var keyWords = ''
    await paramValue.forEach(function (value) {
        if (value !== '') {
            keyWords += value + ' '
        }
        keyWords = keyWords.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
        keyWords = keyWords.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
        keyWords = keyWords.replace(/ì|í|ị|ỉ|ĩ/g, "i");
        keyWords = keyWords.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
        keyWords = keyWords.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
        keyWords = keyWords.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
        keyWords = keyWords.replace(/đ/g, "d");
        keyWords = keyWords.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
        keyWords = keyWords.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
        keyWords = keyWords.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
        keyWords = keyWords.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
        keyWords = keyWords.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
        keyWords = keyWords.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
        keyWords = keyWords.replace(/Đ/g, "D");
        keyWords = keyWords.replace(' ', replaceSpaceCharacter)
    });
    if (keyWords !== '') {
        console.log('key1', keyWords)
        request(rootLink.replace('KEYWORD', keyWords).replace(' ', replaceSpaceCharacter), function (error, response, body) {
            console.log ('link: ', rootLink.replace('KEYWORD', keyWords).replace(' ', replaceSpaceCharacter))
            if (body !== null){
                console.log (regrex)
                var links = body.match(regrex);
                console.log (body)
                if (links !== null){
                    console.log(host + links[0] .replace('"',''))
                    sendTextMessageToUser(senderId, host + links[0] .replace('">',''))
                    sendTextMessageToUser(senderId, host + links[1] .replace('">',''))
                }
                else {
                    sendTextMessageToUser(senderId,rootLink.replace('KEYWORD', keyWords).replace(' ', replaceSpaceCharacter))
                }
            }
           
        });
    }
}

// app.set('port', process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || 8080);
// server.listen(app.get('port'), function() {
//   console.log("Chat bot server listening at %d ",  app.get('port'));
// });
