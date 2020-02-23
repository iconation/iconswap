import React, { useState, useEffect } from 'react'
import { IconConverter } from 'icon-sdk-js'
import { api } from './API'
import { getTokenDetails } from './utils'
import { ICX_TOKEN_CONTRACT } from './constants'

const Swap = ({ match, wallet }) => {
    const swapId = match.params.id
    const [orders, setOrders] = useState(null)
    const [swap, setSwap] = useState(null)
    const [ready, setReady] = useState(false)

    const refreshOrders = (orderId1, orderId2) => {
        api.getOrder(orderId1).then(order1 => {
            getTokenDetails(order1['contract']).then(token => {
                order1['token'] = token
                order1['id'] = orderId1;

                api.getOrder(orderId2).then(order2 => {
                    getTokenDetails(order2['contract']).then(token => {
                        order2['token'] = token
                        order2['id'] = orderId2;

                        setOrders([order1, order2])
                    })
                })

            })
        })
    }

    useEffect(() => {
        const refreshSwap = () => {
            return api.getSwap(swapId).then(swap => {
                refreshOrders(swap['order1'], swap['order2'])
                setSwap(swap)
                !ready && setReady(true)
            })
        }

        refreshSwap()
        if (ready) {
            setInterval(() => {
                refreshSwap()
            }, 1000);
        }
    }, [ready, swapId]);

    const depositOrder = (order) => {
        if (order['contract'] === ICX_TOKEN_CONTRACT) {
            api.fulfillIcxOrder(wallet, order)
        } else {
            api.fulfillIRC2Order(wallet, order);
        }
    }

    const swappable = () => {
        return (orders
            && orders[0]['status'] === 'FILLED'
            && orders[1]['status'] === 'FILLED')
    }

    const cancellable = () => {
        return (swap && swap['status'] === 'PENDING')
    }

    const depositButtonDisabled = (order) => {
        return order['status'] !== 'EMPTY'
    }

    const doSwapClicked = () => {
        api.doSwap(wallet, swapId)
    }

    const cancelSwapClicked = () => {
        api.cancelSwap(wallet, swapId)
    }

    const swapSuccess = () => {
        return swap && swap['status'] === 'SUCCESS'
    }

    const swapCancel = () => {
        return swap && swap['status'] === 'CANCELLED'
    }

    return (
        <>
            {swapSuccess() &&
                <div className="overlay">
                    <div className="overlayText">
                        Swap successfull! <br />
                        <a href={"https://tracker.icon.foundation/transaction/" + swap['transaction']}>
                            Check the transaction
                </a>
                    </div>
                </div>
            }

            {swapCancel() &&
                <div className="overlay">
                    <div className="overlayText">
                        Swap cancelled. Your funds have been refunded. <br />
                        <a href={"https://tracker.icon.foundation/transaction/" + swap['transaction']}>
                            Check the transaction
                    </a>
                    </div>
                </div>
            }

            {orders && <>
                <div className="split left">
                    <div className="centered">
                        <p className="bigtext">
                            {IconConverter.toBigNumber(orders[0]['amount'])
                                / IconConverter.toBigNumber('10').exponentiatedBy(orders[0]['token']['decimals'])
                            } {orders[0]['token']['symbol']} ({orders[0]['token']['name']})
                            </p>
                        <button className="bigbutton" disabled={depositButtonDisabled(orders[0])}
                            onClick={() => { depositOrder(orders[0]) }}>Deposit</button>
                    </div>
                </div>

                <div className="split right">
                    <div className="centered">
                        <p className="bigtext">
                            {IconConverter.toBigNumber(orders[1]['amount'])
                                / IconConverter.toBigNumber('10').exponentiatedBy(orders[1]['token']['decimals'])
                            } {orders[1]['token']['symbol']} ({orders[1]['token']['name']})
                            </p>
                        <button className="bigbutton" disabled={depositButtonDisabled(orders[1])}
                            onClick={() => { depositOrder(orders[1]) }}>Deposit</button>
                    </div>
                </div>

                <div className="center">
                    <button className="bigbutton" disabled={!swappable()}
                        onClick={() => doSwapClicked()}>
                        Swap!
                        </button>
                </div>

                {swap && swap['author'] === wallet &&
                    <div className="bottom">
                        <button className="bigbutton" disabled={!cancellable()}
                            onClick={() => cancelSwapClicked()}>
                            Cancel Swap
                        </button>
                    </div>
                }
            </>}
        </>
    )
}

export default Swap