import React, { useState, useEffect } from 'react'
import { api } from './API'
import { getTokenDetails } from './utils'
import OrderView from './OrderView'
import Overlay from './Overlay'
import InfoBox from './InfoBox'
import './Swap.css';
import swapPicture from './static/img/swap.png'
import { IconConverter } from 'icon-sdk-js'
import { createBrowserHistory } from 'history';

const Swap = ({ match, wallet }) => {
    const swapId = match.params.id
    const [orders, setOrders] = useState([null, null])
    const [swap, setSwap] = useState(null)
    const [ready, setReady] = useState(false)
    const [errorUi, setErrorUi] = useState(null)
    const [intervalHandle, setIntervalHandle] = useState(null)

    const maker = orders[0]
    const taker = orders[1]
    const history = createBrowserHistory();

    history.listen((location, action) => {
        clearInterval(intervalHandle)
    })


    useEffect(() => {

        const refreshOrders = (makerOrderId, takerOrderId) => {
            return api.getOrder(makerOrderId).then(maker => {
                return getTokenDetails(wallet, maker['contract']).then(details => {
                    maker['token'] = details

                    return api.getOrder(takerOrderId).then(taker => {
                        return getTokenDetails(wallet, taker['contract']).then(details => {
                            taker['token'] = details
                            setOrders([maker, taker])
                        })
                    })
                })
            })
        }

        const refreshSwap = () => {
            return api.getSwap(swapId).then(swap => {
                refreshOrders(swap['maker_order_id'], swap['taker_order_id']).then(() => {
                    setSwap(swap)
                    !ready && setReady(true)
                }).catch((error) => {
                    setErrorUi(error)
                })
            })
        }

        refreshSwap()
        if (ready) {
            const interval = setInterval(() => {
                refreshSwap()
            }, 1000)
            setIntervalHandle(interval)
        }
    }, [ready, swapId, wallet]);

    const cancellable = () => {
        return (swap && swap['status'] === 'PENDING')
    }

    const withdrawClicked = () => {
        api.cancelSwap(wallet, swapId).catch(error => { setErrorUi(error) })
    }

    const depositClicked = () => {
        api.fillOrder(wallet, swapId, taker['contract'], taker['amount']).catch(error => { setErrorUi(error) })
    }

    const swapPending = () => {
        return swap && swap['status'] === 'PENDING'
    }

    const swapSuccess = () => {
        return swap && swap['status'] === 'SUCCESS'
    }

    const swapCancel = () => {
        return swap && swap['status'] === 'CANCELLED'
    }

    const isMaker = swapPending() && swap['maker_address'] === wallet
    const isTaker = swapPending() && swap['maker_address'] !== wallet

    // Fatal error
    if (errorUi) {
        return (
            <div className="overlay">
                <div className="overlayText">
                    An error occured : {errorUi}
                </div>
            </div>
        )
    }

    return (
        <>
            {swapSuccess() &&
                <Overlay redirect={"/"} content={`
                    Swap successfull! <br />
                    <a href=` + api.getTrackerEndpoint() + "/transaction/" + swap['transaction'] +
                    ` rel="noopener noreferrer" target="_blank">
                        Check the transaction
                    </a>
                    `} />
            }

            {swapCancel() &&
                <Overlay redirect={"/"} content={`
                    Swap cancelled. Your funds have been refunded. <br />
                    <a href=` + api.getTrackerEndpoint() + "/transaction/" + swap['transaction'] +
                    ` rel="noopener noreferrer" target="_blank">
                        Check the transaction
                    </a>
                    `} />
            }

            {(!maker || !taker) && <>
                <Overlay content={"Loading, please wait..."} />
            </>}

            {isMaker && <InfoBox content={"Your swap has been created successfully! <br/>" +
                "You may share this link with anyone you want to trade your tokens with : <br/>" +
                "<a href='" + window.location.href + "'>" + window.location.href + "</a>"} />}

            {isTaker && <InfoBox content={"You may deposit the amount of tokens displayed on the right (<strong>" +
                IconConverter.toBigNumber(taker['amount']) / IconConverter.toBigNumber('10').exponentiatedBy(taker['token']['decimals']) +
                " " + taker['token']['symbol'] + "</strong>), " +
                "<br/>which will be traded instantly against the amount of tokens displayed on the left (<strong>" +
                IconConverter.toBigNumber(maker['amount']) / IconConverter.toBigNumber('10').exponentiatedBy(maker['token']['decimals']) +
                " " + maker['token']['symbol'] + "</strong>) to your address."} />}

            {maker && taker && <>
                <div className="split left">
                    <div className="centered">
                        <div className="orderViewContainer">
                            <OrderView wallet={wallet} order={maker} />
                            {isMaker &&
                                <div>
                                    <button className="flatbutton actionButton" disabled={!cancellable()}
                                        onClick={() => withdrawClicked()}>
                                        Withdraw
                                </button>
                                </div>
                            }
                        </div>
                    </div>
                </div>

                <div className="split right">
                    <div className="centered">
                        <div className="orderViewContainer">
                            <OrderView wallet={wallet} order={taker} />
                            {isTaker &&
                                <div>
                                    <button className="flatbutton actionButton" disabled={!cancellable()}
                                        onClick={() => depositClicked()}>
                                        Deposit
                                </button>
                                </div>
                            }
                        </div>
                    </div>
                </div>

                <div className="center">
                    <div className="swapLogo"><img src={swapPicture} height="60" alt="logo" /></div>
                </div>
            </>}
        </>
    )
}

export default Swap