import React from 'react'
import './LoginScreen.css';
import { api } from './API'
import { WALLET_LOCAL_STORAGE_KEY } from './constants'

const LoginScreen = ({ setWallet }) => {

    // const [loginType, setLoginType] = useState('ICONEX')
    const loginType = 'ICONEX'

    const loginIconex = () => {
        api.iconexAskAddress().then(address => {
            if (address) {
                localStorage.setItem(WALLET_LOCAL_STORAGE_KEY, address)
                setWallet(address)
            }
        })
    }

    return (
        <>
            <div id="login-screen-root">
                <div className={"login-container"}>
                    <div className={"login-welcome-message"}>Welcome to ICONSwap!</div>
                    <div className={"login-welcome-explain"}>You need to connect your wallet in order to use ICONSwap</div>

                    <div className={"login-connect-buttons"}>

                        <button className={"big-button button-svg-container"}>
                            <svg viewBox="135 0 120 120" width="25" height="25">
                                <g>
                                    <path fill="currentColor" d="M233.5 31.4l-13 13c2.8 4.6 4.4 9.9 4.4 15.7 0 16.6-13.4 30-30 30-5.7 0-11.1-1.6-15.7-4.4l-13 13c8 5.9 17.9 9.5 28.6 9.5 26.5 0 48-21.5 48-48 .2-10.9-3.3-20.8-9.3-28.8zM165 60c0-16.6 13.4-30 30-30 5.7 0 11.1 1.6 15.7 4.4l13-13c-8-5.9-17.9-9.5-28.6-9.5-26.5 0-48 21.5-48 48 0 10.7 3.5 20.6 9.5 28.6l13-13c-3-4.4-4.6-9.8-4.6-15.5z"></path>
                                    <circle fill="currentColor" cx="243" cy="12" r="12"></circle>
                                    <circle fill="currentColor" cx="147" cy="108" r="12"></circle>
                                </g>
                            </svg>
                            <div className="svg-text-button">ICONex</div>
                        </button>

                        <button disabled className={"big-button button-svg-container tooltip"}>
                            <span className="tooltiptext">Not yet available</span>
                            <svg viewBox="0 0 470 470" width="25" height="25">
                                <path fill="currentColor" d="M349.17 15.335h-183v245.6h245.6v-181.7c.1-34.5-28.1-63.9-62.6-63.9zm-239.2 0h-30.7c-34.5 0-64 28.1-64 64v30.7h94.7zm-94.7 152.2h94.7v94.7h-94.7zm301.9 245.6h30.7c34.5 0 64-28.1 64-64v-30.6h-94.7zm-151-94.6h94.7v94.7h-94.7zm-150.9 0v30.7c0 34.5 28.1 64 64 64h30.7v-94.7z"></path>
                            </svg>
                            <div className="svg-text-button">Ledger</div>
                        </button>

                        <button disabled className={"big-button button-svg-container tooltip"}>
                            <span className="tooltiptext">Not yet available</span>
                            <svg viewBox="0 0 550 550" width="25" height="25">
                                <path fill="currentColor" d="M512 176.001C512 273.203 433.202 352 336 352c-11.22 0-22.19-1.062-32.827-3.069l-24.012 27.014A23.999 23.999 0 0 1 261.223 384H224v40c0 13.255-10.745 24-24 24h-40v40c0 13.255-10.745 24-24 24H24c-13.255 0-24-10.745-24-24v-78.059c0-6.365 2.529-12.47 7.029-16.971l161.802-161.802C163.108 213.814 160 195.271 160 176 160 78.798 238.797.001 335.999 0 433.488-.001 512 78.511 512 176.001zM336 128c0 26.51 21.49 48 48 48s48-21.49 48-48-21.49-48-48-48-48 21.49-48 48z"></path>
                            </svg>
                            <div className="svg-text-button">Keystore</div>

                        </button>

                    </div>

                    <div className="login-field login-welcome-explain">
                        {loginType === 'ICONEX' &&
                            <div className="login-iconex">
                                Click the <strong>ICONex Connect</strong> button, then choose a wallet from the ICONex popup.
                            Requires ICONex to be already installed on your device.<br />
                                <button className="big-button iconex-connect-button" onClick={() => { loginIconex() }}>ICONex Connect</button>
                            </div>
                        }

                        {loginType === 'LEDGER' &&
                            <>
                            </>
                        }

                        {loginType === 'KEYSTORE' &&
                            <>
                            </>
                        }
                    </div>

                </div>
            </div>
        </>
    )
}

export default LoginScreen