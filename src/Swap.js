import React, { useState, useEffect } from 'react'
import { api } from './API'
import OrderView from './OrderView'
import LoadingOverlay from './LoadingOverlay'
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
    const [loadingText, setLoadingText] = useState('Loading Swap...')
    const [withdrawingInProgress, setWithdrawingInProgress] = useState(false)
    const [depositingInProgress, setDepositingInProgress] = useState(false)

    const maker = orders[0]
    const taker = orders[1]
    const history = createBrowserHistory();

    history.listen((location, action) => {
        clearInterval(intervalHandle)
    })


    useEffect(() => {

        const refreshOrders = (makerOrderId, takerOrderId) => {
            return api.getOrder(makerOrderId).then(maker => {
                return api.getTokenDetails(wallet, maker['contract']).then(details => {
                    maker['token'] = details

                    return api.getOrder(takerOrderId).then(taker => {
                        return api.getTokenDetails(wallet, taker['contract']).then(details => {
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
            }).catch(error => {
                setErrorUi(error)
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
        api.cancelSwap(wallet, swapId).then(() => {
            setWithdrawingInProgress(true)
            setLoadingText('Withdrawing funds...')
        }).catch(error => {
            setWithdrawingInProgress(false)
            setErrorUi(error)
        })
    }

    const depositClicked = () => {
        api.fillOrder(wallet, swapId, taker['contract'], taker['amount']).then(() => {
            setDepositingInProgress(true)
            setLoadingText('Swapping in progress...')
        }).catch(error => {
            setDepositingInProgress(false)
            setErrorUi(error)
        })
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

    const orderEmpty = (order) => {
        return order && order['status'] === 'EMPTY'
    }

    const isMaker = swapPending() && swap['maker_address'] === wallet
    const isTaker = swapPending() && swap['maker_address'] !== wallet

    withdrawingInProgress && swapCancel() && setWithdrawingInProgress(false)
    depositingInProgress && swapSuccess() && setDepositingInProgress(false)

    const over = ((maker && taker) !== null) && (!withdrawingInProgress) && (!depositingInProgress)

    return (
        <>
            <LoadingOverlay over={over} text={loadingText} />

            {over && <>
                {swapSuccess() &&
                    <InfoBox type={"success"} content={`<strong>The tokens have been traded successful!</strong> <br/>
                    See the transaction on the tracker : <br/>
                    <a href=` + api.getTrackerEndpoint() + "/transaction/0x" + swap['transaction'] +
                        ` rel="noopener noreferrer" target="_blank">0x` + swap['transaction'] + `</a>
                    `} />
                }

                {swapCancel() &&
                    <InfoBox type={"notice"} content={`
                The swap has been cancelled and all funds were refunded. <br />
                See the transaction on the tracker : <br/>
                <a href=` + api.getTrackerEndpoint() + "/transaction/0x" + swap['transaction'] +
                        ` rel="noopener noreferrer" target="_blank">0x` + swap['transaction'] + `</a>
                `} />
                }


                {isMaker && <InfoBox content={"<strong>Your swap has been created successfully!</strong> <br/>" +
                    "You may share this link with anyone you want to trade your tokens with : <br/>" +
                    "<strong><a href='" + window.location.href + "'>" + window.location.href + "</a></strong>"} />}

                {isTaker && <InfoBox content={"You may deposit the amount of tokens displayed on the right (<strong>" +
                    IconConverter.toBigNumber(taker['amount']) / IconConverter.toBigNumber('10').exponentiatedBy(taker['token']['decimals']) +
                    " " + taker['token']['symbol'] + "</strong>), " +
                    "<br/>which will be traded instantly against the amount of tokens displayed on the left (<strong>" +
                    IconConverter.toBigNumber(maker['amount']) / IconConverter.toBigNumber('10').exponentiatedBy(maker['token']['decimals']) +
                    " " + maker['token']['symbol'] + "</strong>) to your address."} />}

                {maker && taker && <>
                    <div className="split left">
                        <div className="centered">
                            <div className={"order-view-container " + (orderEmpty(maker) ? 'order-view-container-pulse' : '')}>
                                <OrderView wallet={wallet} order={maker} />
                                {isMaker &&
                                    <div>
                                        <button className="big-button order-view-action-buttons" disabled={!cancellable()}
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
                            <div className={"order-view-container " + (orderEmpty(taker) ? 'order-view-container-pulse' : '')}>
                                <OrderView wallet={wallet} order={taker} />
                                {isTaker &&
                                    <div>
                                        <button className="big-button order-view-action-buttons" disabled={!cancellable()}
                                            onClick={() => depositClicked()}>
                                            Deposit
                                </button>
                                    </div>
                                }
                            </div>
                        </div>
                    </div>

                    <div className="center">
                        <div className="swap-info">
                            <div className="swap-info-header">
                                Swap Price
                            </div>
                            1 {maker['token']['symbol']} ≈ {parseFloat((taker['amount'] / maker['amount']).toFixed(5)).toString()} {taker['token']['symbol']}
                            <br />
                            1 {taker['token']['symbol']} ≈ {parseFloat((maker['amount'] / taker['amount']).toFixed(5)).toString()} {maker['token']['symbol']}
                        </div>
                    </div>
                </>}
            </>}

            {errorUi && <InfoBox type={"error"} content={"An error occured : " + errorUi} setErrorUi={setErrorUi} />}
        </>
    )
}

export default Swap