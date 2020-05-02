import React from 'react'
import { Link } from 'react-router-dom'
import logo from './static/img/logo.png'
import { WALLET_LOCAL_STORAGE_KEY } from './constants'
import './Header.css'
import { api } from './API'
import { useHistory } from 'react-router-dom';
import { ReactComponent as PowerOffSvg } from './static/svg/PowerOff.svg'
import { ReactComponent as AccountSvg } from './static/svg/Account.svg'
import { ReactComponent as SwapSvg } from './static/svg/Swap.svg'
import { redirectClick } from './utils'
import { ReactComponent as MarketSvg } from './static/svg/listing.svg'
var pjson = require('../package.json')

const Header = ({ wallet, setWallet }) => {

    const history = useHistory();

    const disconnectClick = () => {
        localStorage.removeItem(WALLET_LOCAL_STORAGE_KEY)
        setWallet(null)
    }

    const AccountClick = (event) => {
        redirectClick(event, history, "/account/orders")
    }

    const createSwapClick = (event) => {
        redirectClick(event, history, "/")
    }

    const marketClick = (event) => {
        redirectClick(event, history, "/market")
    }

    return (
        <div id="header">
            <div id="header-content-left">
                <Link to="/"><img src={logo} height="60" alt="logo" /></Link>
                <Link to="/" id="logo-text-href"><div id="logotext">ICONSwap</div></Link>
                <div className="header-bubble">Status: Beta ({pjson.version})</div>
                <div className="header-bubble">Network: {api.getNetworkName()}</div>
            </div>

            {wallet && <>
                <div id="header-content-right">

                    <button className="big-button button-svg-container header-buttons" onMouseDown={(ev) => { disconnectClick(ev) }}>
                        <div className="svg-icon-button"><PowerOffSvg /></div>
                        <div className="svg-text-button">Disconnect</div>
                    </button>

                    <button className="big-button button-svg-container header-buttons" onMouseDown={(ev) => { AccountClick(ev) }}>
                        <div className="svg-icon-button"><AccountSvg /></div>
                        <div className="svg-text-button">Account</div>
                    </button>

                    <button className="big-button button-svg-container header-buttons" onMouseDown={(ev) => { createSwapClick(ev) }}>
                        <div className="svg-icon-button"><SwapSvg /></div>
                        <div className="svg-text-button">Create Swap</div>
                    </button>

                    <button className="big-button button-svg-container header-buttons" onMouseDown={(ev) => { marketClick(ev) }}>
                        <div className="svg-icon-button"><MarketSvg /></div>
                        <div className="svg-text-button">Market</div>
                    </button>
                </div>
            </>}
        </div>
    )
}

export default Header