import React from 'react'
import './OrderView.css';
import { IconConverter } from 'icon-sdk-js'

const OrderView = ({ order }) => {
    const orderSuccess = (order) => {
        return order && (order['status'] === 'FILLED' || order['status'] === 'SUCCESS')
    }

    const orderEmpty = (order) => {
        return order && order['status'] === 'EMPTY'
    }

    return (
        <div className="OrderViewRoot">

            <div className="headerToken">
                <div className="bigtext">
                    {IconConverter.toBigNumber(order['amount'])
                        / IconConverter.toBigNumber('10').exponentiatedBy(order['token']['decimals'])
                    } {order['token']['symbol']} ({order['token']['name']})
                </div>
            </div>

            {orderSuccess(order) && <>
                <div className="success-checkmark">
                    <div className="check-icon">
                        <span className="icon-line line-tip"></span>
                        <span className="icon-line line-long"></span>
                        <div className="icon-circle"></div>
                        <div className="icon-fix"></div>
                    </div>
                </div>
                <div className="OrderStatus">Order deposited</div>
            </>
            }

            {orderEmpty(order) && <>
                <div className="loadingDots">
                    <span>.</span> <span>.</span> <span>.</span>
                </div>
                <div className="OrderStatus">Waiting for deposit</div>
            </>}
        </div>
    )
}

export default OrderView