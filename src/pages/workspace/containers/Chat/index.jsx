/** React */
import React, { Component } from 'react';
import axios from 'axios'
import moment from 'moment'
import io from 'socket.io-client';
import Message from '../../../../components/Message'
import {
    ButtonGroup,
    ButtonDropdown,
    Button,
    InputGroup,
    InputGroupText,
    Input,
    Dropdown,
    DropdownMenu,
    DropdownToggle,
    DropdownItem
} from 'reactstrap';

/*****//*****//*****//*****//*****/
const __NAME__ = 'MENU_NAME'
const __CODE__ = 'Chat'
/**
 * history
 */
/*****//*****//*****//*****//*****/

export default class Chat extends Component {
    socket = io.connect({ path: '/chat' })

    ChatRefs = {
        msgListRef: React.createRef()
    }

    constructor(props) {
        super(props)
    }

    /*************** [ this.state / parameter ] ***************/
    state = {
        userId: '',
        messageInfoList: [],
        userList: {},
        miniMode: {
            size: false,
            newMsg: false,
        },

        inputMessage: '',
        receivers: '',

        open: false
    }

    /** API List 정의 */
    apiList = {
    }

    /*************** [ life cycle ] ***************/
    componentDidMount = () => {
        this.handler.default()
    }

    /*************** [ Event Handler ] ***************/
    handler = {
        /** 최초 실행 코드 */
        default: () => {
            axios.get('/api/account/id').then((res) => {
                this.setState({ userId: res.data }, () => {
                    this.handler.getMessageList()
                })
            })
        },
        sendMessage: () => {
            if (!this.state.inputMessage) { return; }

            const messageInfo = {
                content: {
                    type: 'text',
                    message: this.state.inputMessage
                },
                time: moment().format('YYYY-MM-DD hh:mm:ss'),
                userInfo: {
                    sender: this.state.userId,
                    receivers: this.state.receivers
                }
            }

            axios.post('/api/chat/sendMessage', { messageInfo: messageInfo }).then((res) => {
                /** socket send message */
                if (res.data.result === 'ok') {
                    this.socket.emit('sendMessage', { messageInfo: messageInfo })

                    this.setState({
                        messageInfoList: [...this.state.messageInfoList, res.data.saveMsg],
                        inputMessage: '',
                        receivers: ''
                    }, () => {
                        this.func.scrollToBottom()
                    })
                }
            })
        },
        getMessageList: () => {
            axios.get('/api/chat/msgList').then((res) => {
                console.log(res)
                this.setState({ messageInfoList: res.data }, () => {
                    this.func.setSocketEvent()
                    this.func.scrollToBottom()
                })
            })
        }
    }

    /*************** [ 개인 정의 함수 ] ***************/
    /** 메뉴 기능 함수 정의 */
    func = {
        /** socket 통신 관련 이벤트 등록 */
        setSocketEvent: () => {
            this.socket.on('connect', () => {
                console.log('success connecting')
            })

            this.socket.on('disconnect', (res) => {
                console.log('disconnected', res)
                this.setState({ userList: res.userList })
            })

            this.socket.on('userList', (res) => {
                console.log('userList', res.userList)
                this.setState({ userList: res.userList })
            })

            this.socket.on('reciMessage', (res) => {
                console.log('reciMessage', res)
                if (res.messageInfo.userInfo.sender !== this.state.userId) {
                    this.setState({
                        messageInfoList: [...this.state.messageInfoList, res.messageInfo],
                        miniMode: {
                            ...this.state.miniMode,
                            newMsg: this.state.miniMode.size ? true : false,
                        }
                    }, () => {
                        this.func.scrollToBottom()
                    })
                }
            })

            this.socket.emit('join', { userId: this.state.userId })
        },
        /** 채팅창 스크롤 최하단 이동 설정 */
        scrollToBottom: () => {
            if (!!this.ChatRefs.msgListRef.current) {
                // scrollHeight 
                //{top:0, left:0, behavior:'auto'}
                this.ChatRefs.msgListRef.current.scrollTo(
                    0,
                    this.ChatRefs.msgListRef.current.scrollHeight
                )
            }
        },
        /** 채팅창 최소/최대화 설정 */
        resizing: () => {
            this.setState({
                miniMode: {
                    size: !this.state.miniMode.size,
                    newMsg: false
                }
            })
        },
        setReceiver: (receiver) => {
            this.setState({ receivers: receiver })
        }
    }

    /*************** [ render ] ***************/
    render() {
        return (
            this.state.miniMode.size ?

                /** 미니 모드 */
                <div id='chattingBoxMini' className='commonBtn' onClick={this.func.resizing} >
                    {
                        this.state.miniMode.newMsg ? <div className='newMsg'>N</div> : <></>
                    }
                </div> :

                /** 채팅창 모드 */
                <div id='chattingBox'>
                    <div className='titleBar'>
                        <div className='userCount'>참여 인원 : {Object.keys(this.state.userList).length}</div>
                        <Button close
                            onClick={this.func.resizing} />
                    </div>
                    <div className='msgList' ref={this.ChatRefs.msgListRef}>
                        {
                            this.state.messageInfoList.map((v) => {
                                return (
                                    <Message
                                        userId={this.state.userId}
                                        messageInfo={v}
                                        callback={{
                                            setReceiver: this.func.setReceiver
                                        }} />
                                )
                            })
                        }
                    </div>
                    <div className='msgBtnList'>
                        <div>
                            {!!this.state.receivers ? `${this.state.receivers} 에게 귓속말` : ''}
                            {!!this.state.receivers ? <Button close onClick={() => { this.setState({ receivers: '' }) }} /> : <></>}
                        </div>
                        <ButtonGroup>
                            <ButtonDropdown
                                isOpen={this.state.open}
                                toggle={() => { this.setState({ open: !this.state.open }) }}>
                                <DropdownToggle caret>
                                    사용자
                                </DropdownToggle>
                                <DropdownMenu>
                                    {
                                        Object.keys(this.state.userList).filter((v) => { return v !== this.state.userId }).map((v) => {
                                            return (
                                                <DropdownItem
                                                    onClick={() => {
                                                        console.log(v)
                                                        this.setState({ receivers: v })
                                                    }}>
                                                    {v}
                                                </DropdownItem>
                                            )
                                        })
                                    }
                                </DropdownMenu>
                            </ButtonDropdown>
                            <Button onClick={this.handler.sendMessage}>보내기</Button>
                        </ButtonGroup>
                    </div>
                    <div className='msgInputArea'>
                        <textarea className='inputArea'
                            value={this.state.inputMessage}
                            onChange={(e) => {
                                this.setState({ inputMessage: e.target.value })
                            }}
                            onKeyPress={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.handler.sendMessage(); } }} />
                    </div>
                </div>
        )
    }

}