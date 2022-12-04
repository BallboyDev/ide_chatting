const multer = require('multer')
const router = require('express').Router()
const fs = require('fs')
const moment = require('moment')

const modFile = require('../../../models/fileUpload')
const Error = require('../util/error');
const util = require('./util')

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads')
    },
    filename: (req, file, cb) => {
        // file.orininalname
        cb(null, file.originalname)

        // let timeStamp = + new Date()

        // cb(null, `F_${timeStamp}`)
    }
})

const upload = multer({ storage: storage }).single('file')

/** 파일 존재 확인 */
router.get('/upload', async (req, res, next) => {
    try {
        const count = await modFile.find({ fileName: req.query.fileName })

        if (count.length > 0) {
            throw new Error.AlreadyExists()
        }

        return res.json({ result: 'ok' })
    } catch (ex) {
        next(ex);
    }
})

/** 파일 업로드 */
router.post('/upload', async (req, res, next) => {

    try {
        const unzip = req.query.file

        upload(req, res, async (err) => {
            const { filename, originalname } = req.file
            const ext = originalname.split('.').reverse()

            const uploadFileInfo = new modFile({
                key: util.makeKey(),
                fileName: originalname,
                type: (ext.length > 1 && !!ext[0]) ? ext[0] : '',
                tree: originalname,
                insert: moment().format('YYYY-MM-DD hh:mm:ss'),
                modify: moment().format('YYYY-MM-DD hh:mm:ss')
            })

            await uploadFileInfo.save()

            /** 압축해제 */
            if (!!unzip && unzip === 'zip') {
                util.unzip(`${originalname}`, res)
            } else if (!!unzip && unzip === 'tar') {
                util.untar(`${originalname}`, res)
            } else {
                return res.json({
                    result: await util.fileTree()
                })
            }
        })
    } catch (ex) {
        next(ex)
    }

})

/** 파일 호출 */
router.get('/fileList', async (req, res, next) => {


    const tree = await modFile.find({}, { _id: false, fileName: true, tree: true })
    const fileList = tree.map((v) => {
        return v.tree
    })

    console.log('fileList', fileList)

    return res.json({ fileTree: fileList })
})

/** 파일 내용 읽어 오기 */
router.post('/readFile', (req, res, next) => {
    return res.json({ content: util.readFile(req.body.path).replace(/\r/gi, '') })
})

/** 파일 수정 / 저장 */
router.post('/saveFile', (req, res, next) => {

    const { path, content } = req.body

    return res.json(util.saveFile(path, content))
})

/** 새 파일/폴더 생성 */
router.post('/makeNewItem', async (req, res, next) => {
    const { form, name, path } = req.body
    console.log(form, name, path)

    const ext = name.split('.').reverse()
    if ((path || '') === '') {

        await modFile.create({
            key: util.makeKey(),
            fileName: name,
            type: ((form === '2') ? 'forder' : ((ext.length > 1 && !!ext[0]) ? ext[0] : '')),
            tree: ((form === '1') ? name : {[name]: new Object()}),
            insert: moment().format('YYYY-MM-DD hh:mm:ss'),
            modify: moment().format('YYYY-MM-DD hh:mm:ss')
        })
    }
    const result = await util.makeNewItem(form, name, path)


    return res.json(result)
})

router.get('/refactoring', async (req, res, next) => {
    console.log(req.query)

    const { form, path, name } = req.query
    let result = await util.refactoring(form, path, name)
    await util.fileTree()
    return res.json({ result: result })
})

module.exports = router