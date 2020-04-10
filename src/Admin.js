import React, { useState, useEffect } from 'react'
import './Admin.css';
import CustomInput from './CustomInput'
import { api } from './API'

const Admin = ({ wallet }) => {

    const [cancelSwapId, setCancelSwapId] = useState(null)


    const [swapsLoadingCount, setSwapsLoadingCount] = useState(0)
    const [swapsLoadingPendingCount, setSwapsLoadingPendingCount] = useState(0)
    const [swapsLoadingSuccessCount, setSwapsLoadingSuccessCount] = useState(0)
    const [finishedLoadingSwaps, setFinishedLoadingSwaps] = useState(null)
    const [finishedLoadingPending, setFinishedLoadingPending] = useState(null)
    const [finishedLoadingSuccess, setFinishedLoadingSuccess] = useState(null)
    const [pendingSwapsFull, setPendingSwapsFull] = useState(null)
    const [successSwapsFull, setSuccessSwapsFull] = useState(null)
    const [swapsList, setswapsList] = useState({})
    const [pendingSwapsList, setpendingSwapsList] = useState({})
    const [successSwapsList, setsuccessSwapsList] = useState({})
    const [maintenanceMode, setMaintenanceMode] = useState({})
    const ITERATION_COUNT = 100;

    const doMaintenanceMode = () => {
        api.setMaintenanceMode(wallet, maintenanceMode).then(() => {
            alert('Maintenance mode modified !')
        })
    }

    const getSwapRangeAsync = (from, iteration) => {

        let promises = []

        for (let curSwapId = from; curSwapId < (from + iteration); curSwapId++) {
            promises.push(api.getSwap(curSwapId))
        }

        return promises
    }

    const getSwapsAsync = async (from, iteration = ITERATION_COUNT) => {
        let running = true

        for (let curSwapId = from; running; curSwapId += iteration) {
            const promises = getSwapRangeAsync(curSwapId, iteration)
            try {
                const result = await Promise.all(promises)
                result.forEach(swap => {
                    swapsList[swap['id']] = swap
                    addSwapToLists(swap)
                })
                setSwapsLoadingCount(result.slice(-1)[0]['id'])
            } catch (error) {
                running = false
                if (iteration > 2) {
                    await getSwapsAsync(curSwapId, Math.trunc(iteration / 2))
                } else {
                    await getSwapsSync(curSwapId)
                }
            }
        }
    }

    const addSwapToLists = (swap) => {
        switch (swap['status']) {
            case 'PENDING':
                pendingSwapsList[swap['id']] = swap
                break;

            case 'SUCCESS':
                successSwapsList[swap['id']] = swap
                break;

            default:
                break;
        }

        swapsList[swap['id']] = swap
    }

    const getSwapsSync = async (from) => {
        let running = true

        for (let curSwapId = from; running; curSwapId++) {

            try {
                const swap = await api.getSwap(curSwapId)
                if (swap) {
                    addSwapToLists(swap)
                    setSwapsLoadingCount(curSwapId)
                }
            } catch (error) {
                running = false
            }
        }
    }


    const getAllSwaps = async () => {
        getSwapsAsync(1).then(() => {
            setFinishedLoadingSwaps(true)
            setSwapsLoadingPendingCount(Object.keys(pendingSwapsList).length)
            setFinishedLoadingPending(true)
            setSwapsLoadingSuccessCount(Object.keys(successSwapsList).length)
            setFinishedLoadingSuccess(true)
        })
    }
    Object.keys(swapsList).length === 0 && getAllSwaps()


    const cancelOneSwap = () => {
        api.cancelSwapAdmin(wallet, cancelSwapId).then(result => {
            alert('Swap cancelled!')
        }).catch(error => {
            alert(error)
        })
    }

    const cancelAllSwaps = async () => {
        if (!finishedLoadingSuccess) {
            alert("Swap not finished loading!")
        }
        let promises = []
        const pendingSwaps = Object.keys(pendingSwapsList)
        let swapsCancelled = 0

        if (pendingSwaps.length > 0) {
            const firstId = pendingSwaps.pop()
            alert("You're about to cancel " + Object.keys(pendingSwapsList).length + " swaps." +
                "Don't forget to enable automatic signing")
            await api.cancelSwapAdmin(wallet, parseInt(firstId))
            swapsCancelled++;

            pendingSwaps.forEach(swapId => {
                promises.push(api.cancelSwapAdmin(wallet, parseInt(swapId)))
            })
            swapsCancelled += promises.length
        }

        Promise.all(promises).then(() => {
            alert("Swaps cancelled : " + swapsCancelled)
        })
    }

    return (
        <>
            <div id="admin-screen-root">
                <div className={"admin-container"}>
                    <div className={"admin-welcome-message"}>Welcome Admin!</div>
                    <div className={"admin-welcome-explain"}>If you are not admin, you are still welcome :)</div>

                    <div className={"admin-cancel-one-swap-container"}>
                        <CustomInput
                            label="SwapID"
                            locked={false}
                            active={false}
                            numericOnly={true}
                            onChange={(value) => { setCancelSwapId(parseInt(value)) }}
                        />
                        <button className="admin-button" onClick={() => cancelOneSwap()}>Cancel Swap</button>
                    </div>

                    <br />
                    <hr />
                    <br />

                    <div className={"admin-cancel-all-swap-container"}>
                        <button className="admin-button" disabled={!finishedLoadingSuccess} onClick={() => cancelAllSwaps()}>Cancel all swaps ({swapsLoadingCount})</button>
                    </div>

                    <br />
                    <hr />
                    <br />

                    <div className={"admin-maintenance-mode"}>

                        <CustomInput
                            label="Mode"
                            locked={false}
                            active={false}
                            numericOnly={true}
                            onChange={(value) => { setMaintenanceMode(parseInt(value)) }}
                        />
                        <button className="admin-button" onClick={() => doMaintenanceMode()}>Set Maintenance Mode</button>

                    </div>


                </div>
            </div>
        </>
    )
}

export default Admin