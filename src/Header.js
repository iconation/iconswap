import React from 'react'
import { Link } from 'react-router-dom'
import logo from './static/img/logo.png'
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

    const myOrdersClick = () => {
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
            <div id="headercontentleft">
                <Link to="/"><img src={logo} height="60" alt="logo" /></Link>
                <Link to="/" id="logotexthref"><div id="logotext">ICONSwap</div></Link>
                <div id="headerBubble">Status: Beta</div>
                <div id="headerBubble">Network: {api.getNetworkName()}</div>
            </div>
            {wallet && <>
                <div id="headercontentright">
                    <button className="flatbutton" onClick={() => { createSwapClick() }}>Create Swap</button>
                    <button className="flatbutton" onClick={() => { myOrdersClick() }}>My Orders</button>
                    <button className="flatbutton" onClick={() => { disconnectClick() }}>Disconnect</button>
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