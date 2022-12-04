/** React */
import React, { Component } from 'react';
import axios from 'axios'
import path from 'path'
import Tree from '../../../../components/Tree'
import {
    ButtonGroup,
    Button,
    Form,
    FormGroup,
    Label,
    Col,
    Input,
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Tooltip
} from 'reactstrap';

/*****//*****//*****//*****//*****/
const __NAME__ = 'MENU_NAME'
const __CODE__ = 'FileManager'
/**
 * history
 */
/*****//*****//*****//*****//*****/

const exeList = ['TXT', 'C', 'PY', 'JAVA', 'JS', 'JSX', 'CSS', 'HTML', 'SCSS', 'JSON', 'SQL', 'MD', 'ENV']

export default class FileManager extends Component {

    FileManagerRefs = {
        editRef: React.createRef(),
        tooltipRef: React.createRef()
    }

    constructor(props) {
        super(props)

    }
	
    /*************** [ this.state / parameter ] ***************/
    state = {
        selectFile: null,
        selectPath: '',
        fileTree: [],
        readFile: {
            path: '',
            content: '',
            save: true,
            support: true
        },
        fileList: [],
        dlgOpen: {
            fileUploadOpen: false,
            makeNewItemOpen: false,
        },
        tooltipOpen: {
            uploadOpen: false,
            newItemOpen: false,
            refreshOpen: false,
        },
        makeItemData: {
            form: '1', // 1: 파일 / 2: 폴더
            path: '',
            name: '',
        },
        currentTooltip: null
    }

    /*************** [ life cycle ] ***************/
    componentDidMount = () => {
        this.handler.default()
    }

    /*************** [ Event Handler ] ***************/
    handler = {
        /** 최초 실행 코드 */
        default: () => {
            console.log('ballboy default')

            this.handler.fileList()
        },
        /** 파일 업로드 */
        upload: () => {

            if ((this.state.selectFile || '') === '') {
                alert('업로드할 파일(폴더)를 선택해주세요')
                return
            }

            const formData = new FormData();
            formData.append('file', this.state.selectFile)

            let params = { file: this.state.selectFile.name }
            const exe = this.state.selectFile.name.split('.').reverse()[0]
            if (['zip', 'tar'].indexOf(exe) >= 0) {
                params['file'] = confirm('압축파일입니다. 압축을 해제 하시겠습니까?') ? exe : this.state.selectFile.name
            }

            axios.get('/api/fileUpload/upload', { params: { fileName: this.state.selectFile.name } }).then((res) => {

                console.log('result1', res)
                return axios.post('/api/fileUpload/upload/', formData, { params: params })
            }).then((res) => {
                this.handler.fileList()
            }).catch((err) => {
                this.func.getErrMsg(err)
            })
        },
        /** 파일 내용 불러오기 */
        readFile: (filePath) => {
            const fileExe = (path.basename(filePath).split('.')[1] || path.basename(filePath).split('.')[0]).toUpperCase()

            axios.post('/api/fileUpload/readFile', { path: filePath }).then((res) => {
                let tempFile = {
                    support: (exeList.indexOf(fileExe) >= 0),
                    save: true,
                    content: (exeList.indexOf(fileExe) >= 0) ? res.data.content : '지원하지 않는 형식입니다.',
                    path: filePath
                }

                let tempList = []
                if (this.state.fileList.map((v) => { return v.path }).indexOf(filePath) < 0) {
                    tempList = [...this.state.fileList, tempFile]
                } else {
                    tempList = this.state.fileList
                }

                this.setState({
                    fileList: tempList,
                    readFile: tempFile
                })
            })
        },
        /** 선택 된 Path 저장 */
        setPath: (path) => {
            this.setState({ selectPath: path })
        },
        /** 파일 저장 */
        saveFile: () => {
            console.log('!!!!saveFile')
            axios.post('/api/fileUpload/saveFile', this.state.readFile).then((res) => {
                const readFile = this.state.readFile
                this.setState({
                    fileList: this.state.fileList.map((v) => {
                        if (v.path === readFile.path) {
                            return { ...v, save: true }
                        } else { return v }
                    }),
                    readFile: { ...readFile, save: true }
                })
            })
        },
        /** 수정 중인 파일 종료 */
        closeFile: (fileInfo) => {
            if (!fileInfo.save) {
                if (!confirm('파일이 수정 후 저장되지 않았습니다. 파일을 종료 하시겠습니까?')) return;
            }

            let temp = { fileList: [], readFile: {} }
            if (this.state.fileList.length === 1) {
                /** 파일리스트에 선언된 파일이 하나 일 경우 */
                temp = {
                    fileList: [],
                    readFile: {
                        path: '',
                        content: '',
                        save: true
                    },
                }
            } else if (this.state.readFile.path === this.state.fileList[0].path) {
                /** 파일리스트의 첫번째 파일이 에디터에 있는데 종료 할 때 */
                temp = {
                    fileList: this.state.fileList.filter((v) => { return v.path !== fileInfo.path }),
                    readFile: this.state.fileList[1]
                }
            } else if (fileInfo.path === this.state.readFile.path) {
                /** 현재 에디터에 불러와있는 파일을 종료 할 때 */
                temp = {
                    fileList: this.state.fileList.filter((v) => { return v.path !== fileInfo.path }),
                    readFile: this.state.fileList[0]
                }
            } else {
                /** 에디터에 표시되고 있는 파일이 아닌것을 종료 할 때 */
                temp = {
                    fileList: this.state.fileList.filter((v) => { return v.path !== fileInfo.path }),
                }
            }

            this.setState(temp)
        },
        /** 파일 수정 */
        editMofify: (e) => {
            this.setState({
                fileList: this.state.fileList.map((v) => {
                    if (v.path === this.state.readFile.path) {
                        return { ...v, save: false }
                    } else { return v }
                }),
                readFile: {
                    ...this.state.readFile,
                    save: false,
                    content: e.target.value
                }
            })
        },
        /** 새 파일/폴더 만들기 */
        makeNewItem: () => {
            console.log('makeNewData', this.state.makeItemData)
            axios.post('/api/fileUpload/makeNewItem', this.state.makeItemData).then((res) => {
                this.setState({
                    makeItemData: { form: '1', name: '', path: '' }
                }, () => { this.handler.fileList() })
            })
        },
        /** 파일/폴더 리스트 새로 고침 */
        fileList: () => {
            axios.get('/api/fileUpload/fileList').then((res) => {
                console.log('res', res.data)
                this.setState({
                    selectFile: '',
                    fileTree: res.data.fileTree
                })
            })
        },
        /** 파일/폴더 이름 바꾸기 */
        openRenameDlg: () => {
            this.setState({
                makeItemData: {
                    form: '3', // 3: 삭제 / 4: 삭제
                    path: this.state.selectPath,
                    name: ''
                },
                dlgOpen: { ...this.state.dlgOpen, renameOpen: true }
            }, () => { this.handler.fileList() })
        },
        itemRename: () => {
            if ((this.state.makeItemData.name || '') === '') {
                alert('바꿀 이름을 입력해 주세요')
                return;
            }

            axios.get('/api/fileUpload/refactoring', { params: this.state.makeItemData }).then((res) => {
                if (res.result === 'err') {
                    alert('같은 이름의 파일/폴더가 이미 존재 합니다.')
                }
                this.setState({
                    dlgOpen: {
                        ...this.state.dlgOpen,
                        renameOpen: false
                    }
                }, () => { this.handler.fileList() })
            })
        },
        /** 파일/폴더 삭제 */
        itemRemove: () => {
            this.setState({
                makeItemData: {
                    form: '4', // 3: 삭제 / 4: 삭제
                    path: this.state.selectPath,
                    name: path.basename(this.state.selectPath)
                }
            }, () => {
                axios.get('/api/fileUpload/refactoring', { params: this.state.makeItemData }).then((res) => {
                    this.handler.fileList()
                })
            })

        }
    }

    /*************** [ 개인 정의 함수 ] ***************/
    /** 메뉴 기능 함수 정의 */
    func = {
        getErrMsg: (err) => {
            console.log('error info >> ', err)
            let errCode = err.response.status
            switch (errCode) {
                case 419:
                    alert('같은 이름의 파일(폴더)가 이미 존재합니다.')
                    break;
                default:
                    console.error(err)
            }
        },
        tabInsert: (e) => {
            if (e.key === 'Tab') {
                e.preventDefault()
                let content = this.state.readFile.content
                let f = content.substring(0, this.FileManagerRefs.editRef.current.selectionStart)
                let b = content.substring(this.FileManagerRefs.editRef.current.selectionStart, content.length)
                let pos = this.FileManagerRefs.editRef.current.selectionStart

                this.setState({
                    readFile: {
                        ...this.state.readFile,
                        content: `${f}    ${b}`
                    }
                }, () => {
                    this.FileManagerRefs.editRef.current.selectionStart = pos + 4
                    this.FileManagerRefs.editRef.current.selectionEnd = pos + 4
                })
            }
        },
        /** 모든 툴팁 닫기 */
        closeTooltip: () => {
            this.setState({ currentTooltip: true }, () => {
                this.setState({ currentTooltip: false })
            })
        },

    }

    /*************** [ render ] ***************/
    render() {
        return (
            <>
                <div className='workspace' onClick={() => { this.func.closeTooltip() }}>
                    <div className='fileListArea'>
                        <div className='fileUtil'>
                            <div className='commonBtn upload'
                                id='upload'
                                onClick={() => {
                                    console.log('프로젝트 업로드')
                                    this.setState({ dlgOpen: { ...this.state.dlgOpen, fileUploadOpen: true } })
                                }}></div>
                            <Tooltip
                                placement="bottom"
                                target="upload"
                                isOpen={this.state.tooltipOpen.uploadOpen}
                                toggle={() => { this.setState({ tooltipOpen: { ...this.state.tooltipOpen, uploadOpen: !this.state.tooltipOpen.uploadOpen } }) }}>
                                프로젝트 업로드
                            </Tooltip>
                            <div className='commonBtn newItem' id='newItem'
                                onClick={() => {
                                    console.log('새 파일/폴더 만들기')
                                    this.setState({
                                        dlgOpen: { ...this.state.dlgOpen, makeNewItemOpen: true },
                                        makeItemData: {
                                            ...this.state.makeItemData,
                                            path: this.state.selectPath,
                                        }
                                    })
                                }}></div>
                            <Tooltip
                                placement="bottom"
                                target="newItem"
                                isOpen={this.state.tooltipOpen.newItemOpen}
                                toggle={() => { this.setState({ tooltipOpen: { ...this.state.tooltipOpen, newItemOpen: !this.state.tooltipOpen.newItemOpen } }) }}>
                                새 파일/폴더 만들기
                            </Tooltip>
                            <div className='commonBtn refresh' id='refresh'
                                onClick={() => { this.handler.fileList() }}></div>
                            <Tooltip
                                placement="bottom"
                                target="refresh"
                                isOpen={this.state.tooltipOpen.refreshOpen}
                                toggle={() => { this.setState({ tooltipOpen: { ...this.state.tooltipOpen, refreshOpen: !this.state.tooltipOpen.refreshOpen } }) }}>
                                새로고침
                            </Tooltip>
                        </div>
                        <div className={'fileList'}
                            onClick={() => { this.setState({ selectPath: '' }) }}>
                            <ul className={'tree'}>
                                {
                                    this.state.fileTree.map((v) => {
                                        return (
                                            <Tree
                                                fileName={(typeof v === 'string') ? v : (Object.keys(v)[0] || v)}
                                                path={(typeof v === 'string') ? v : v[Object.keys(v)[0]]}
                                                root={(typeof v === 'string') ? v : (Object.keys(v)[0] || v)}
                                                currentTooltip={this.state.currentTooltip}
                                                callback={{
                                                    readFile: this.handler.readFile,
                                                    setPath: this.handler.setPath,
                                                    makeNewItem: () => {
                                                        this.setState({
                                                            dlgOpen: { ...this.state.dlgOpen, makeNewItemOpen: true },
                                                            makeItemData: {
                                                                ...this.state.makeItemData,
                                                                path: this.state.selectPath,
                                                            }
                                                        })
                                                    },
                                                    openRenameDlg: this.handler.openRenameDlg,
                                                    itemRemove: this.handler.itemRemove,
                                                    setTooltipClose: this.handler.setTooltipClose
                                                }} />
                                        )
                                    })
                                }

                            </ul>
                        </div>
                    </div>
                    <div className='editArea'>
                        <div className='buttonList'>
                            <div className='fileList'>
                                {this.state.fileList.map((v1) => {
                                    const select = this.state.readFile
                                    return (
                                        <>
                                            <ButtonGroup>
                                                <Button
                                                    color={v1.path === select.path ? 'primary' : 'secondary'}
                                                    onClick={() => {
                                                        this.setState({
                                                            fileList: this.state.fileList.map((v2) => {
                                                                if (v2.path === this.state.readFile.path) {
                                                                    return this.state.readFile
                                                                } else { return v2 }
                                                            }),
                                                            readFile: v1
                                                        })
                                                    }}>
                                                    {`${!v1.save ? '*' : ''} ${path.basename(v1.path)}`}
                                                </Button>
                                                <Button
                                                    color={v1.path === select.path ? 'primary' : 'secondary'}
                                                    onClick={() => { this.handler.closeFile(v1) }}>
                                                    Ⅹ
                                                </Button>
                                            </ButtonGroup><p>&nbsp;</p>
                                        </>
                                    )
                                })}
                            </div>

                            <ButtonGroup>
                                <Button
                                    onClick={this.handler.saveFile}
                                    disabled={!this.state.readFile.support}>
                                    저장
                                </Button>
                            </ButtonGroup>
                        </div>
                        {
                            this.state.readFile.support && !!this.state.readFile.path ?
                                <textarea className='editField'
                                    ref={this.FileManagerRefs.editRef}
                                    value={this.state.readFile.content}
                                    onChange={(e) => { this.handler.editMofify(e) }}
                                    onKeyDown={this.func.tabInsert} /> :
                                <textarea className='editField'
                                    ref={this.FileManagerRefs.editRef}
                                    value={this.state.readFile.content}
                                    disabled />
                        }

                    </div>
                </div>

				{/* upload */}
                <Modal isOpen={this.state.dlgOpen.fileUploadOpen}>
                    <ModalHeader toggle={() => { this.setState({ dlgOpen: { ...this.state.dlgOpen, fileUploadOpen: false } }) }}>
                        파일 / 폴더 업로드
                    </ModalHeader>
                    <ModalBody>
                        <Input name="file" type="file"
                            onChange={(e) => {
                                this.setState({ selectFile: e.target.files[0] })
                            }} />
                    </ModalBody>
                    <ModalFooter>
                        <Button
                            color="primary"
                            onClick={() => {
                                this.setState({ dlgOpen: { ...this.state.dlgOpen, fileUploadOpen: false } }, () => {
                                    this.handler.upload()
                                })
                            }}>
                            업로드
                        </Button>
                        {' '}
                        <Button onClick={() => { this.setState({ dlgOpen: { ...this.state.dlgOpen, fileUploadOpen: false } }) }}>
                            취소
                        </Button>
                    </ModalFooter>
                </Modal>

				{/* new item */}
                <Modal isOpen={this.state.dlgOpen.makeNewItemOpen}>
                    <ModalHeader toggle={() => { this.setState({ dlgOpen: { ...this.state.dlgOpen, makeNewItemOpen: false } }) }}>
                        새 파일/폴더 만들기
                    </ModalHeader>
                    <ModalBody>

                        <Form>
                            <FormGroup row>
                                <Label sm={4}>생성 형식</Label>
                                <Col sm={10}>
                                    <ButtonGroup>
                                        <Button
                                            color={this.state.makeItemData.form === '1' ? 'primary' : 'secondary'}
                                            onClick={() => { this.setState({ makeItemData: { ...this.state.makeItemData, form: '1' } }) }}>
                                            파일
                                        </Button>
                                        <Button
                                            color={this.state.makeItemData.form === '2' ? 'primary' : 'secondary'}
                                            onClick={() => { this.setState({ makeItemData: { ...this.state.makeItemData, form: '2' } }) }}>
                                            폴더
                                        </Button>
                                    </ButtonGroup>
                                </Col>
                            </FormGroup>
                            <FormGroup row>
                                <Label sm={4}>생성 경로</Label>
                                <Col sm={10}>
                                    <Input
                                        placeHolder={'Root'}
                                        value={this.state.makeItemData.path}
                                        onChange={(e) => {
                                            this.setState({ makeItemData: { ...this.state.makeItemData, path: e.target.value } })
                                        }} />
                                </Col>
                            </FormGroup>
                            <FormGroup row>
                                <Label sm={4}>파일/폴더 이름</Label>
                                <Col sm={10}>
                                    <Input
                                        onChange={(e) => {
                                            this.setState({ makeItemData: { ...this.state.makeItemData, name: e.target.value } })
                                        }} />
                                </Col>
                            </FormGroup>
                        </Form>
                    </ModalBody>
                    <ModalFooter>
                        <Button
                            color="primary"
                            onClick={() => {
                                const { form, name, path } = this.state.makeItemData
                                if (((name || '') === '') || ['1', '2'].indexOf(form) < 0) {
                                    alert('데이터를 정확히 입력 해 주세요')
                                    return
                                }

                                this.setState({
                                    dlgOpen: { ...this.state.dlgOpen, makeNewItemOpen: false },
                                }, () => {
                                    this.handler.makeNewItem()
                                })
                            }}>
                            만들기
                        </Button>
                        {' '}
                        <Button
                            onClick={() => {
                                this.setState({
                                    dlgOpen: { ...this.state.dlgOpen, makeNewItemOpen: false },
                                    makeItemData: { form: '1', name: '', paht: '' }
                                })
                            }}>
                            취소
                        </Button>
                    </ModalFooter>
                </Modal>

				{/* Rename */}
                <Modal isOpen={this.state.dlgOpen.renameOpen}>
                    <ModalHeader toggle={() => { this.setState({ dlgOpen: { ...this.state.dlgOpen, renameOpen: false } }) }}>
                        파일 / 폴더 이름 바꾸기
                    </ModalHeader>
                    <ModalBody>
                        <Input
                            value={this.state.makeItemData.name}
                            placeHolder={path.basename(this.state.selectPath)}
                            onChange={(e) => {
                                this.setState({ makeItemData: { ...this.state.makeItemData, name: e.target.value } })
                            }} />
                    </ModalBody>
                    <ModalFooter>
                        <Button
                            color="primary"
                            onClick={this.handler.itemRename}>
                            업로드
                        </Button>
                        {' '}
                        <Button onClick={() => { this.setState({ dlgOpen: { ...this.state.dlgOpen, renameOpen: false } }) }}>
                            취소
                        </Button>
                    </ModalFooter>
                </Modal>
            </>
        )
    }

}