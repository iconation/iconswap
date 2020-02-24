import React, { useState, useEffect } from 'react'
import { api } from './API'
import { getTokenDetails } from './utils'
import OrderView from './OrderView'
import './Swap.css';

const Swap = ({ match, wallet }) => {
    const swapId = match.params.id
    const [orders, setOrders] = useState(null)
    const [swap, setSwap] = useState(null)
    const [ready, setReady] = useState(false)
    const [errorUi, setErrorUi] = useState(null)

    useEffect(() => {

        const refreshOrders = (orderId1, orderId2) => {
            return api.getOrder(orderId1).then(order1 => {
                return getTokenDetails(wallet, order1['contract']).then(token => {
                    order1['token'] = token
                    order1['id'] = orderId1;

                    return api.getOrder(orderId2).then(order2 => {
                        return getTokenDetails(wallet, order2['contract']).then(token => {
                            order2['token'] = token
                            order2['id'] = orderId2;

                            setOrders([order1, order2])
                        })
                    })
                })
            })
        }

        const refreshSwap = () => {
            return api.getSwap(swapId).then(swap => {
                refreshOrders(swap['order1'], swap['order2']).then(() => {
                    setSwap(swap)
                    !ready && setReady(true)
                }).catch((error) => {
                    setErrorUi(error)
                })
            })
        }

        refreshSwap()
        if (ready) {
            setInterval(() => {
                refreshSwap()
            }, 1000);
        }
    }, [ready, swapId, wallet]);

    const swappable = () => {
        return (orders
            && orders[0]['status'] === 'FILLED'
            && orders[1]['status'] === 'FILLED'
            && (wallet === orders[0]['provider'] || wallet === orders[1]['provider'])
        )
    }

    const cancellable = () => {
        return (swap && swap['status'] === 'PENDING')
    }

    const doSwapClicked = () => {
        api.doSwap(wallet, swapId).catch(error => { setErrorUi(error) })
    }

    const cancelSwapClicked = () => {
        api.cancelSwap(wallet, swapId).catch(error => { setErrorUi(error) })
    }

    const swapSuccess = () => {
        return swap && swap['status'] === 'SUCCESS'
    }

    const swapCancel = () => {
        return swap && swap['status'] === 'CANCELLED'
    }

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
                <div className="overlay">
                    <div className="overlayText">
                        Swap successfull! <br />
                        <a href={api.getTrackerEndpoint() + "/transaction/" + swap['transaction']} rel="noopener noreferrer" target="_blank">
                            Check the transaction
                </a>
                    </div>
                </div>
            }

            {swapCancel() &&
                <div className="overlay">
                    <div className="overlayText">
                        Swap cancelled. Your funds have been refunded. <br />
                        <a href={api.getTrackerEndpoint() + "/transaction/" + swap['transaction']} rel="noopener noreferrer" target="_blank">
                            Check the transaction
                    </a>
                    </div>
                </div>
            }

            {!orders && <>
                <div className="overlay">
                    <div className="overlayText">
                        Loading, please wait...
                    </div>
                </div>
            </>}

            {orders && <>
                <div className="split left">
                    <div className="centered">
                        <OrderView wallet={wallet} order={orders[0]} />
                    </div>
                </div>


                <div className="split right">
                    <div className="centered">
                        <OrderView wallet={wallet} order={orders[1]} />
                    </div>
                </div>

                <div className="center">
                    <button className="flatbutton bigbutton" disabled={!swappable()}
                        onClick={() => doSwapClicked()}>
                        Swap!
                    </button>
                </div>

                {swap && swap['author'] === wallet &&
                    <div className="bottom">
                        <button className="flatbutton" disabled={!cancellable()}
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