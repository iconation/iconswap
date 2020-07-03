import React, { useState, useEffect } from 'react'
import './Admin.css';
import CustomInput from './CustomInput'
import { api } from './API'

const Admin = ({ wallet }) => {

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