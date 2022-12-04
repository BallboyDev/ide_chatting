const router = require('express').Router()
const modChat = require('../../../models/chat')
const Error = require('../util/error')

const send = async (messageInfo) => {
    const { userInfo, content, time } = messageInfo

    if (!userInfo.sender || !content.message) {

        throw new Error.InvalidRequest();
    }

    const index = await modChat.find()

    const sendMessageInfo = new modChat({
        index: index.length + 1,
        userInfo: userInfo,
        content: {
            type: content.type,
            message: content.message.replace(/\n/gi, '<br/>')
        },
        time: time
    });

    let result = await sendMessageInfo.save();
    return result;
}

router.get('/msgList', async (req, res, next) => {
    const id = req.session.user.id

    let chat = await modChat.find({
        $or: [
            { 'userInfo.sender': id },
            { 'userInfo.receivers': '' },
            { 'userInfo.receivers': id },
        ]
    }, {_id: false, index: true, userInfo: true, content: true, time: true})
    res.json(chat)

})

router.post('/sendMessage', async (req, res, next) => {

    try {
        const result = await send(req.body.messageInfo)
        res.send({ result: 'ok', saveMsg: result })
    } catch (err) {
        next(err)
    }
})

module.exports = router;