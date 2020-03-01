import React, { useState } from 'react'
import { api } from './API'
import './AccountOrders.css'


const AccountOrders = ({ wallet }) => {
    const [openOrders, setOpenOrders] = useState(null)

    api.getOpenOrdersByAddress(wallet).then(list => {
        setOpenOrders(list)
    })

    return (
        <div id="account-orders-root">
            {openOrders && Object.keys(openOrders).map(order => (
                console.log(order) && <></>
            ))}
        </div>
    )
}

export default AccountOrders