const fs = require('fs')
const tar = require('tar-fs')
const zip = require('zip-lib')
const modFile = require('../../../models/fileUpload')
const moment = require('moment')
const path = require('path')

const uploadPath = `${process.env.PWD}/uploads`

exports.makeTree = (root, filePath) => {
    let temp = {}

    try {
        if (fs.statSync(`${root}/${filePath}`).isDirectory()) {
            let items = fs.readdirSync(`${root}/${filePath}`)

            /** 불러온 목록을 파일/폴더 별로 정렬 */
            items.sort((item) => {
                return fs.statSync(`${root}/${filePath}/${item}`).isDirectory() ? -1 : 1
            }).map((item) => {
                temp[item] = this.makeTree(root, `${filePath}/${item}`)
            })
        } else {
            temp = filePath
        }
    } catch (ex) {
        console.error(ex)
    }

    return temp
}

exports.fileTree = async () => {
    let files = fs.readdirSync(uploadPath)
	
	console.log('fileTree!!!!!!!!!!!!', files)

    files.map(async (file) => {
        let tree = this.makeTree(uploadPath, file)
        // return typeof item === 'string' ? item : { [file]: item }

				// await modFile.findOne({ fileName: file }, (err, item) => {
			
				// if (!!item) {
				// item.tree = (typeof item['tree'] === 'string') ? tree : { [file]: tree }
				// item.save()
				// }
				// })
		console.log('fileTree!!!!', file, tree)
		await modFile.update(
			{fileName: file}, 
			{$set: {'tree': (tree === 'string') ? tree : { [file]: tree }}
		})
    })
    return 'ok'
}

exports.readFile = (filePath) => {
    console.log(`${uploadPath}/${filePath}`)

    return fs.readFileSync(`${uploadPath}/${filePath}`).toString()
}

exports.saveFile = (filePath, content) => {
    try {
        fs.writeFileSync(`${uploadPath}/${filePath}`, content)

        return { result: 'ok' }
    } catch (ex) {
        return { result: 'err', errMsg: ex }
    }
}

exports.unzip = (rootPath, res) => {
    const filePath = `${uploadPath}/${rootPath}`
    const savePath = filePath.split('/').slice(0, filePath.split('/').length - 1).join('/')

    zip.extract(filePath, savePath)
        .then(async () => {
            const uploadFileInfo = new modFile({
                key: this.makeKey(),
                fileName: rootPath.split('.')[0],
                type: 'forder',
                insert: moment().format('YYYY-MM-DD hh:mm:ss'),
                modify: moment().format('YYYY-MM-DD hh:mm:ss')
            })

            await uploadFileInfo.save()


            return res.json({
                result: await this.fileTree()
            })
        }).catch(() => {
            return res.json({
                result: 'error'
            })
        })
}

exports.untar = (rootPath, res) => {
    const filePath = `${uploadPath}/${rootPath}`
    const savePath = filePath.split('/').slice(0, filePath.split('/').length - 1).join('/')

    try {

        fs.createReadStream(filePath).pipe(tar.extract(savePath)
            .on('finish', async () => {
                const uploadFileInfo = new modFile({
                    key: this.makeKey(),
                    fileName: rootPath.split('.')[0],
                    type: 'forder',
                    insert: moment().format('YYYY-MM-DD hh:mm:ss'),
                    modify: moment().format('YYYY-MM-DD hh:mm:ss')
                })

                await uploadFileInfo.save()

                return res.json({
                    result: await this.fileTree()
                })
            }).on('error', () => {
                return res.json({
                    result: 'error',
                })
            }));
    } catch (ex) {
        return { result: 'err', errMsg: ex }
    }

}

exports.makeKey = () => {
    let temp = 'abcdefghijklmnopqrstuvwxyz0123456789'
    let key = ''
    for (let i = 0; i < temp.length; i++) {
        let idx = Math.floor(Math.random() * temp.length)
        key += temp.slice(idx, idx + 1)
    }

    return key
}

exports.makeNewItem = async (form, name, filePath) => {
    const mkPath = `${uploadPath}/${filePath}/${name}`
    let result = { result: 'ok' }
    await fs.access(mkPath, fs.constants.R_OK, (res) => {
        if ((res || '') === '') {
            result = { result: 'err', errMsg: '이미 존재하는 파일/폴더 입니다.' }
            console.log('access', result)
        } else {
            try {
                if (form === '1') {
                    console.log('file')
                    fs.openSync(mkPath, 'w')
                } else {
                    console.log('forder')
                    fs.mkdirSync(mkPath, { recursive: true })
                }
            } catch (ex) {

                result = { result: 'err', errMsg: ex }
                console.log('err', result)
            }
        }
		
		this.fileTree()
    })

    

    return result
}

exports.deleteForder = (filePath) => {
    try {
        if (fs.existsSync(filePath) && fs.lstatSync(filePath).isDirectory()) {
            fs.readdirSync(filePath).map((file) => {
                let curPath = `${filePath}/${file}`
                if (fs.lstatSync(curPath).isDirectory()) {
                    this.deleteForder(curPath);
                } else {
                    fs.unlinkSync(curPath);
                }
            })

            console.log('directory delete success')
            fs.rmdirSync(filePath);
        } else {
            console.log('file delete success')
            fs.unlinkSync(filePath);
        }

    } catch (ex) {
        console.log(ex)
    }


}

exports.refactoring = async (form, filePath, name) => {

    if (form === '3') {
        const mkPath = `${uploadPath}/${path.dirname(filePath)}`

        try {
            console.log('test!!!!!', mkPath)
            if ((path.dirname(filePath) || '.') === '.') {
                await modFile.update({ fileName: path.basename(filePath) }, { $set: { fileName: name } })
            }

            fs.renameSync(`${uploadPath}/${filePath}`, `${mkPath}/${name}`)

            return 'ok'
        } catch (ex) {
            return 'err'
        }
    } else if (form === '4') {
        const mkPath = `${uploadPath}/${filePath}`
        if ((path.dirname(filePath) || '.') === '.') {
            await modFile.deleteOne({ fileName: path.basename(filePath) })
        }

        this.deleteForder(mkPath)
        return 'ok'
    }

}
