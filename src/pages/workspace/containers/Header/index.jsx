import React from 'react';
import { DropdownToggle, UncontrolledDropdown, DropdownMenu, DropdownItem } from 'reactstrap';
import axios from 'axios';

import style from './style.scss';

class Header extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			userId: ''
		};
	}

	componentDidMount() {
		axios.get('/api/account/id').then(({ data }) => {
			this.setState({
				userId: data
			});
		});
	}

	signOut = () => {
		window.location.href = '/api/account/signout';
	};

	render() {
		const { userId } = this.state;
		return (
			<div className={style.Header}>
				<UncontrolledDropdown>
					<DropdownToggle caret tag="a" className={style.Header__dropdown}>
						{userId}
					</DropdownToggle>
					<DropdownMenu right>
						<DropdownItem onClick={this.signOut}>로그아웃</DropdownItem>
						<DropdownItem onClick={() => {console.log('ballboy test Button')}}>개인정보 수정</DropdownItem>
					</DropdownMenu>
				</UncontrolledDropdown>
			</div>
		);
	}
}

export default Header;