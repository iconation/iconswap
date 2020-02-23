import React from 'react'
import { Link } from 'react-router-dom'
import logo from './static/img/logo.png'
import { WALLET_LOCAL_STORAGE_KEY } from './constants'
import './Header.css';
import { api } from './API';

const Header = ({ wallet, setWallet }) => {

    const disconnectClick = () => {
        localStorage.removeItem(WALLET_LOCAL_STORAGE_KEY)
        setWallet(null)
    }

    return (
        <div id="header">
            <div id="headercontentleft">
                <Link to="/"><img src={logo} height="60" alt="logo" /></Link>
                <Link to="/" id="logotexthref"><div id="logotext">ICONSwap</div></Link>
                <div id="headerBubble">Status: Beta</div>
                <div id="headerBubble">Network: {api.getNetworkName()}</div>
            </div>
            {wallet && <>
                <div id="headercontentright">
                    <button className="disconnect" onClick={() => { disconnectClick() }}>Disconnect</button>
                </div>
            </>}
        </div>
    )
}

export default Header