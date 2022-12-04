/** React */
import React, { Component } from 'react';
import axios from 'axios'
import path from 'path'

/*****//*****//*****//*****//*****/
const __NAME__ = 'MENU_NAME'
const __CODE__ = 'Tree'
/**
 * history
 */
/*****//*****//*****//*****//*****/

export default class Tree extends Component {

    state = {
        open: false,
        tooltipOpen: false,
        tooltipData: {
            exe: '',
            path: ''
        }
    }

    componentDidUpdate = (prevProps) => {
		console.log(prevProps.currentTooltip, this.props.currentTooltip)
        if ((prevProps.currentTooltip !== this.props.currentTooltip) && !this.state.open) {
            this.func.tooltipClick()
        }
    }

    func = {
        tooltipClick: () => {
            this.setState({ tooltipOpen: false })
        },
        tooltipViewer: () => {
            return (
                <div className='treeTooltip'>
                    <div className='commonToolTipBtn'
                        onClick={() => {
                            this.func.tooltipClick()
                            this.props.callback.openRenameDlg()
                        }}>이름바꾸기</div>
                    <div className='commonToolTipBtn'
                        onClick={() => {
                            this.func.tooltipClick()
                            this.props.callback.itemRemove()
                        }}>삭제</div>
                    {
                        this.state.tooltipData.exe === 'forder' ?
                            <div className='commonToolTipBtn'
                                onClick={() => {
                                    this.func.tooltipClick()
                                    this.props.callback.makeNewItem()
                                }}>새 파일/폴더 만들기</div> : <></>
                    }
                </div>
            )
        },

    }

    /*************** [ render ] ***************/
    render() {
        return (<>
            {typeof this.props.path === 'object' ?
                <>
                    <li className='treeItem treeForder'>
                        <div className='commonBtn'
                            onContextMenu={(e) => {
                                e.preventDefault();
                                this.setState({
                                    tooltipOpen: !this.state.tooltipOpen,
                                    tooltipData: {
                                        exe: 'forder',
                                        path: this.props.root
                                    }
                                }, () => { this.props.callback.setPath(this.props.root) })
                            }}
                            onClick={(e) => {
                                this.setState({ open: !this.state.open }, () => {
                                    this.props.callback.setPath(this.props.root)
                                })
                            }}>{this.state.open ? '▼' : '▶'} {this.props.fileName}</div>
                    </li>
                    {this.state.tooltipOpen ? this.func.tooltipViewer() : <></>}
                    {
                        this.state.open ?
                            <ul >
                                {
                                    Object.keys(this.props.path).map((v) => {
                                        return (
                                            <Tree
                                                fileName={v}
                                                path={this.props.path[v]}
                                                root={`${this.props.root}/${v}`}
                                                currentTooltip={this.props.currentTooltip}
                                                callback={{
                                                    readFile: this.props.callback.readFile,
                                                    setPath: this.props.callback.setPath,
                                                    makeNewItem: this.props.callback.makeNewItem,
                                                    itemRemove: this.props.callback.itemRemove,
                                                    openRenameDlg: this.props.callback.openRenameDlg,
                                                    setTooltipClose: this.props.callback.setTooltipClose
                                                }}
                                            />
                                        )
                                    })
                                }
                            </ul> :
                            <></>
                    }

                </> : <>
                    <li className='commonBtn treeItem treeFile'>
                        <div
                            onContextMenu={(e) => {
                                e.preventDefault();
                                this.setState({
                                    tooltipOpen: !this.state.tooltipOpen,
                                    tooltipData: {
                                        exe: 'file',
                                        path: this.props.root
                                    }
                                }, () => { this.props.callback.setPath(this.props.root) })
                            }}
                            onClick={() => { this.props.callback.setPath(path.dirname(this.props.path)) }}
                            onDoubleClick={() => {
                                this.props.callback.setPath(path.dirname(this.props.path))
                                this.props.callback.readFile(this.props.path)
                            }}>📜 {this.props.fileName}</div>
                    </li>
                    {this.state.tooltipOpen ? this.func.tooltipViewer() : <></>}
                </>
            }
        </>
        )
    }

}