import React from 'react';

const Message = (props) => {
    const { userId, messageInfo, callback } = props
    return (
        <div className={`messageInfo ${userId === messageInfo.userInfo.sender ? 'sendMsg' : 'reciMsg'}`}>
            <div className='user_time'>
                {
                    userId === messageInfo.userInfo.sender ?
                        (<><div className='time'>{messageInfo.time}</div><div className='user'>{messageInfo.userInfo.sender}</div></>) :
                        (<><div className='user'>{messageInfo.userInfo.sender}</div><div className='time'>{messageInfo.time}</div></>)
                }
            </div>
            <div className='content commonBtn'
                onClick={() => {
                    console.log('click', messageInfo.userInfo.sender)
                    if (userId !== messageInfo.userInfo.sender) {
                        callback.setReceiver(messageInfo.userInfo.sender)
                    }
                }}>
                {userId === messageInfo.userInfo.receivers ? `< ${messageInfo.userInfo.sender}님으로 부터의 귓속말 >` : ''}
                {userId === messageInfo.userInfo.sender && !!messageInfo.userInfo.receivers ? `< ${messageInfo.userInfo.receivers}님 에게 귓속말>` : ''}
                {!!messageInfo.userInfo.receivers ? <br /> : <></>}
                {messageInfo.content.message}
            </div>
        </div>
    )
}

export default Message;