import React from 'react'
import './MaintenanceScreen.css';

const MaintenanceScreen = ({ setWallet }) => {

    return (
        <>
            <div id="maintenance-screen-root">
                <div className={"maintenance-container"}>
                    <div className={"maintenance-welcome-message"}>Sorry, ICONSwap is in maintenance mode!</div>
                    <div className={"maintenance-welcome-explain"}>Please come back in few minutes.</div>
                </div>
            </div>
        </>
    )
}

export default MaintenanceScreen