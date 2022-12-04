import React from 'react';

import Header from './containers/Header';
import Chat from './containers/Chat';
import FileManager from './containers/FileManager'

const Workspace = () => (
	<div className='wrapperWorkspace'>
		{/** workspace header area */}
		<Header />
		{/** FileManager area */}
		<FileManager />
		{/** chatting area */}
		<Chat />
		{/* <div>workspace</div> */}
	</div>
);

export default Workspace;