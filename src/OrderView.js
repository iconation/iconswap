import React from 'react'
import './OrderView.css';
import { IconConverter } from 'icon-sdk-js'
import { api } from './API'
import { ICX_TOKEN_CONTRACT } from './constants'

const OrderView = ({ wallet, order }) => {
    const orderSuccess = (order) => {
        return order && order['status'] === 'FILLED'
    }

    const orderEmpty = (order) => {
        return order && order['status'] === 'EMPTY'
    }

    const depositButtonDisabled = (order) => {
        return order['status'] !== 'EMPTY'
    }

    const withdrawButtonDisabled = (order) => {
        return order['status'] !== 'FILLED'
    }

    const depositOrder = (order) => {
        if (order['contract'] === ICX_TOKEN_CONTRACT) {
            api.fulfillIcxOrder(wallet, order)
        } else {
            api.fulfillIRC2Order(wallet, order);
        }
    }

    const refundOrder = (order) => {
        api.refundOrder(wallet, order)
    }

    return (
        <>
            {orderSuccess(order) &&
                <div className="success-checkmark">
                    <div className="check-icon">
                        <span className="icon-line line-tip"></span>
                        <span className="icon-line line-long"></span>
                        <div className="icon-circle"></div>
                        <div className="icon-fix"></div>
                    </div>
                </div>
            }

            {orderEmpty(order) && <>
                <div className="waitForDeposit">Waiting for deposit</div>
                <div className="loadingDots">
                    <span>.</span> <span>.</span> <span>.</span></div>
            </>}

            <p className="bigtext">
                {IconConverter.toBigNumber(order['amount'])
                    / IconConverter.toBigNumber('10').exponentiatedBy(order['token']['decimals'])
                } {order['token']['symbol']} ({order['token']['name']})
            </p>

            <div className="buttonsAction">
                <button className="flatbutton" disabled={depositButtonDisabled(order)}
                    onClick={() => { depositOrder(order) }}>Deposit</button>
                <button className="flatbutton" disabled={withdrawButtonDisabled(order)}
                    onClick={() => { refundOrder(order) }}>Withdraw</button>
            </div>
        </>
    )
}

export default OrderView