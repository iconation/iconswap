import React, { useState, useEffect } from 'react'
import './Admin.css';
import CustomInput from './CustomInput'
import { api } from './API'
import { treasuryAPI } from './API_treasury'
import { TREASURY_SCORE_ENDPOINT, ICX_TOKEN_CONTRACT, ICX_TOKEN_DECIMALS, TAP_TOKEN_CONTRACT } from './constants';
import { IconConverter } from 'icon-sdk-js'

const Admin = ({ wallet }) => {

    const [excessFunds, setExcessFunds] = useState(0)
    const [tapFunds, setTapFunds] = useState(0)
    const [icxFunds, setIcxFunds] = useState(0)
    const [cancelSwapId, setCancelSwapId] = useState(null)
    const [isMaintenanceEnabled, setIsMaintenanceEnabled] = useState(null)

    const doMaintenanceMode = (status) => {
        api.setMaintenanceMode(wallet, status ? 1 : 0).then(() => {
            alert('Maintenance mode modified !')
            setIsMaintenanceEnabled(status)
        })
    }

    const cancelOneSwap = () => {
        if (cancelSwapId === null || isNaN(cancelSwapId)) {
            return;
        }

        api.cancelSwapAdmin(wallet, cancelSwapId).then(result => {
            alert('Swap cancelled!')
        }).catch(error => {
            alert(error)
        })
    }

    !isMaintenanceEnabled && api.isMaintenanceEnabled().then(result => {
        setIsMaintenanceEnabled(result)
    })

    api.getBalance(TREASURY_SCORE_ENDPOINT, ICX_TOKEN_CONTRACT).then(funds => {
        const digits = IconConverter.toBigNumber('10').exponentiatedBy(ICX_TOKEN_DECIMALS)
        const balance = IconConverter.toBigNumber(funds).dividedBy(digits).toString()
        setIcxFunds(balance)
    })

    api.getBalance(TREASURY_SCORE_ENDPOINT, TAP_TOKEN_CONTRACT).then(funds => {
        const digits = IconConverter.toBigNumber('10').exponentiatedBy(18)
        const balance = IconConverter.toBigNumber(funds).dividedBy(digits).toString()
        setTapFunds(balance)
    })

    treasuryAPI.icxFundsExcess().then(funds => {
        const digits = IconConverter.toBigNumber('10').exponentiatedBy(18)
        const balance = IconConverter.toBigNumber(funds).dividedBy(digits).toString()
        setExcessFunds(balance)
    })

    return (
        <>
            <div id="admin-screen-root">
                <div className={"admin-container"}>
                    <div className={"admin-welcome-message"}>Welcome Admin!</div>
                    <div className={"admin-welcome-explain"}>If you are not admin but a curious ICONist, you are still welcome :)</div>

                    <div className={"admin-items-container"}>
                        <div className={"admin-item admin-cancel-one-swap-container"}>
                            <CustomInput
                                label="SwapID"
                                locked={false}
                                active={false}
                                numericOnly={true}
                                onChange={(value) => { setCancelSwapId(parseInt(value)) }}
                            />
                            <button className="admin-button" onClick={() => cancelOneSwap()}>Cancel Swap</button>
                        </div>

                        <br /><hr /><br />

                        <div className={"admin-item admin-funds"}>
                            <CustomInput
                                label={"ICX Funds : " + icxFunds}
                                locked={true}
                                active={false}
                                numericOnly={false}
                            />
                            <CustomInput
                                label={"TAP Funds : " + tapFunds}
                                locked={true}
                                active={false}
                                numericOnly={false}
                            />
                            <CustomInput
                                label={"Excess ICX Funds : " + excessFunds}
                                locked={true}
                                active={false}
                                numericOnly={false}
                            />
                        </div>

                        <br /><hr /><br />

                        <div className={"admin-item admin-maintenance-mode"}>
                            <CustomInput
                                label={isMaintenanceEnabled ? "Maintenance ON" : "Maintenance OFF"}
                                locked={true}
                                active={false}
                                numericOnly={false}
                            />
                            <div className={"admin-maintenance-buttons"}>
                                <button className="admin-button"
                                    onClick={() => doMaintenanceMode(true)}>Enable</button>
                                <button className="admin-button"
                                    onClick={() => doMaintenanceMode(false)}>Disable</button>
                            </div>
                        </div>

                        <br /><hr /><br />

                    </div>
                </div>
            </div>
        </>
    )
}

export default Admin