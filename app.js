const express = require('express');
const path = require('path');
const http = require('http');
const webpack = require('webpack');
const session = require('express-session');
const redisStore = require('connect-redis')(session);
const redis = require('redis');
const socketIO = require('socket.io')
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const modChat = require('./models/chat')
const middlewares = require('./middlewares');
const { subscribe } = require('./routes/view');

let userList = {}

const initExpress = redisClient => {
    const app = express();
    const PORT = 3000;

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));

    app.use(
        session({
            key: 'app.sid',
            secret: 'session-secret',
            store: new redisStore({
                host: '127.0.0.1',
                port: 6379,
                client: redisClient,
                prefix: 'session:',
                db: 0
            }),
            resave: false,
            saveUninitialized: true,
            cookie: { path: '/', maxAge: 1800000 }
        })
    );

    app.use(express.static(path.resolve('./dist/client')));
    app.use(express.static(path.resolve('./statics')));
    app.use(express.static(path.resolve('./node_modules')));

    /** view 라우터 */
    app.use('/', require('./routes/view'));
    /** API 라우터 */
    app.use('/api', require('./routes/api'));

    /** error 처리 부분 */
    app.use(middlewares.error.logging);
    app.use(middlewares.error.ajaxHandler);
    app.use(middlewares.error.handler);

    /** 서버 실행 */
    return require('http')
        .createServer(app)
        .listen(PORT, () => {
            console.log('Express server listening on port ' + PORT);
        });
};

const initRedis = () => redis.createClient()
const initMongo = async () => {
    await mongoose.connect('mongodb://localhost:27017/app', { useNewUrlParser: true });
};

const initChat = (server) => {

    const io = socketIO(server, { path: '/chat' })

    io.on('connection', (client) => {

        client.on('join', (res) => {
            userList[res.userId] = client.id
            console.log('join userList', userList, client.id)
            io.emit('userList', { userList: userList })
        })

        client.on("sendMessage", (res) => {
            if (!!res.messageInfo.userInfo.receivers) {
                console.log('귓속말', res)
                /** 귓속말 */
                io.to(userList[res.messageInfo.userInfo.receivers]).emit('reciMessage', { messageInfo: res.messageInfo })
            } else {
                console.log('모두에게', res)
                /** 모두에게 */
                io.emit('reciMessage', { messageInfo: res.messageInfo })
            }
        });

        client.on('disconnect', () => {
            console.log('disconnect', client.id)
            let temp = {}
            Object.keys(userList).map((v) => {
                if (userList[v] !== client.id) {
                    temp[v] = userList[v]
                }
            })
            userList = temp
            console.log('disconnect userList', userList, client.id)
            io.emit('userList', { userList: userList })
        });

    });


}

const main = () => {
    initMongo().then(() => {
        const redisClient = initRedis()
        const server = initExpress(redisClient);
        initChat(server)
    });
};

main();