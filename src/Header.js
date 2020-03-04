import React from 'react'
import { Link } from 'react-router-dom'
import logo from './static/img/logo.png'
import PowerOffSvg from './static/svg/PowerOffSvg.js'
import SwapSvg from './static/svg/SwapSvg.js'
import AccountSvg from './static/svg/AccountSvg.js'
import { WALLET_LOCAL_STORAGE_KEY } from './constants'
import './Header.css'
import { api } from './API'
import { IconConverter } from 'icon-sdk-js'
import { useHistory } from 'react-router-dom';

const Header = ({ wallet, setWallet }) => {

    const history = useHistory();

    const disconnectClick = () => {
        localStorage.removeItem(WALLET_LOCAL_STORAGE_KEY)
        setWallet(null)
    }

    const AccountClick = () => {
        history.push("/account/orders");
    }

    const createSwapClick = () => {
        history.push("/");
    }

    const isAdmin = () => {
        return wallet === 'hxcc8c9d91d0db660f91d8041af702d79edcb02958'
    }

    const sendTestNetICX = () => {

        const address = document.getElementById('toAddress').value

        return api.__iconexIcxTransaction(wallet, address, 10000000000000000000).then(txHash => {
            return true
        })
    }

    const sendTestNetTAP = () => {

        const address = document.getElementById('toAddress').value

        // 100 TAP
        const value = IconConverter.toHex(1000 * 1000000000000000000)

        const params = {
            '_to': address,
            '_value': value
        }

        return api.__iconexCallTransaction(wallet, 'cx429c8563414991a2c5566fa9518c3f10da242487', 'transfer', 0, params).then(txHash => {
            console.log("txHash", txHash)
        })
    }

    return (
        <div id="header">
            <div id="header-content-left">
                <Link to="/"><img src={logo} height="60" alt="logo" /></Link>
                <Link to="/" id="logo-text-href"><div id="logotext">ICONSwap</div></Link>
                <div className="header-bubble">Status: Beta</div>
                <div className="header-bubble">Network: {api.getNetworkName()}</div>
            </div>

            {wallet && <>
                <div id="header-content-right">

                    <button className="big-button button-svg-container header-buttons" onClick={() => { disconnectClick() }}>
                        <PowerOffSvg />
                        <div className="svg-text-button">Disconnect</div>
                    </button>

                    <button className="big-button button-svg-container header-buttons" onClick={() => { AccountClick() }}>
                        <AccountSvg />
                        <div className="svg-text-button">Account</div>
                    </button>

                    <button className="big-button button-svg-container header-buttons" onClick={() => { createSwapClick() }}>
                        <SwapSvg />
                        <div className="svg-text-button">Create Swap</div>
                    </button>

                    {isAdmin() && <><br />
                        <input type="text" id="toAddress"></input>
                        <button onClick={() => { sendTestNetICX() }}>Send ICX</button>
                        <button onClick={() => { sendTestNetTAP() }}>Send TAP</button>
                    </>
                    }
                </div>
            </>}
        </div>
    )
}

export default Header