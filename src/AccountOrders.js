import React, { useState } from 'react'
import { api } from './API'
import './AccountOrders.css'
import './Table.css'
import { useHistory } from 'react-router-dom'


const AccountOrders = ({ wallet }) => {
    const [openSwaps, setOpenSwaps] = useState(null)
    const [filledSwaps, setFilledSwaps] = useState(null)
    const history = useHistory();

    const convertTsToDate = (timestamp) => {
        function pad(n) { return n < 10 ? '0' + n : n }

        var a = new Date(parseInt(timestamp, 16) / 1000);
        var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        var year = a.getFullYear();
        var month = months[a.getMonth()];
        var date = pad(a.getDate());
        var hour = pad(a.getHours());
        var min = pad(a.getMinutes());
        var sec = pad(a.getSeconds());
        var time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec;
        return time;
    }

    const getAllSwapDetails = (swaps) => {
        const promises = Object.entries(swaps).map(([key, swap]) => {
            swap['id'] = key
            return api.getOrder(swap['maker_order_id']).then(maker => {
                return api.getOrder(swap['taker_order_id']).then(taker => {
                    swap['timestamp'] = convertTsToDate(swap['timestamp'])
                    swap['maker'] = maker
                    swap['taker'] = taker
                    return api.getTokenDetails(wallet, swap['maker']['contract']).then(details => {
                        swap['maker']['token'] = details
                        return api.getTokenDetails(wallet, swap['taker']['contract']).then(details => {
                            swap['taker']['token'] = details
                            return api.balanceToFloat(swap['taker']['amount'], swap['taker']['contract']).then(balance => {
                                swap['taker']['amountDisplay'] = balance
                                return api.balanceToFloat(swap['maker']['amount'], swap['maker']['contract']).then(balance => {
                                    swap['maker']['amountDisplay'] = balance
                                    return swap
                                })
                            })
                        })
                    })
                })
            })
        })

        return Promise.all(promises).then(result => {
            return result
        })
    }

    !openSwaps && api.getOpenedOrdersByAddress(wallet).then(swaps => {
        getAllSwapDetails(swaps).then(result => {
            setOpenSwaps(result)
        })
    })

    !filledSwaps && api.getFilledOrdersByAddress(wallet).then(swaps => {
        getAllSwapDetails(swaps).then(result => {
            setFilledSwaps(result)
        })
    })

    const onClickView = (swap) => {
        history.push("/swap/" + swap['id'])
    }

    return (<>

        {!(openSwaps && filledSwaps) && <>
            <div className="overlay">
                <div className="overlayText">
                    Loading, please wait...
                </div>
            </div>
        </>}

        <div id="account-orders-root">
            <div id="account-orders-container">
                <div className="container-swaps-item">
                    <div className="container-swaps-item-container">
                        <div className="account-orders-title">Opened Swaps</div>

                        <table className="swaps-table" cellSpacing='0'>

                            <thead>
                                <tr>
                                    <th>Offer</th>
                                    <th>Receive</th>
                                    <th>Creation</th>
                                    <th>Action</th>
                                </tr>
                            </thead>

                            <tbody>
                                {openSwaps && Object.keys(openSwaps).map(order => (
                                    <tr key={order}>
                                        <td>{openSwaps[order]['maker']['amountDisplay'] + " " + openSwaps[order]['maker']['token']['symbol']}</td>
                                        <td>{openSwaps[order]['taker']['amountDisplay'] + " " + openSwaps[order]['taker']['token']['symbol']}</td>
                                        <td>{openSwaps[order]['timestamp']}</td>
                                        <td><button onClick={() => { onClickView(openSwaps[order]) }}>View</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="container-swaps-item">
                    <div className="container-swaps-item-container">
                        <div className="account-orders-title">Filled Swaps</div>

                        <table className="swaps-table" cellSpacing='0'>

                            <thead>
                                <tr>
                                    <th>Offer</th>
                                    <th>Receive</th>
                                    <th>Creation</th>
                                    <th>Action</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filledSwaps && Object.keys(filledSwaps).map(order => (
                                    <tr key={order}>
                                        <td>{filledSwaps[order]['maker']['amountDisplay'] + " " + filledSwaps[order]['maker']['token']['symbol']}</td>
                                        <td>{filledSwaps[order]['taker']['amountDisplay'] + " " + filledSwaps[order]['taker']['token']['symbol']}</td>
                                        <td>{filledSwaps[order]['timestamp']}</td>
                                        <td><button onClick={() => { onClickView(filledSwaps[order]) }}>View</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </>)
}

export default AccountOrders