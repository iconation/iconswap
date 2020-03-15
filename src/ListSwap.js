import React, { useState } from 'react'
import { useHistory } from 'react-router-dom'
import LoadingOverlay from './LoadingOverlay'
import InfoBox from './InfoBox'
import { api } from './API'
import { IconConverter } from 'icon-sdk-js'
import './ListSwap.css'

const ListSwap = ({ wallet }) => {

    const [errorUi, setErrorUi] = useState(null)
    const [swapsLoadingCount, setSwapsLoadingCount] = useState(0)
    const [finishedLoadingSwaps, setFinishedLoadingSwaps] = useState(null)
    const [finishedLoadingPending, setFinishedLoadingPending] = useState(null)
    const [finishedLoadingSuccess, setFinishedLoadingSuccess] = useState(null)
    const [pendingSwapsFull, setPendingSwapsFull] = useState(null)
    const [successSwapsFull, setSuccessSwapsFull] = useState(null)
    const history = useHistory();
    const [swapsList, setswapsList] = useState({})
    const [pendingSwapsList, setpendingSwapsList] = useState({})
    const [successSwapsList, setsuccessSwapsList] = useState({})
    const ITERATION_COUNT = 100;

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
                    swap['timestamp_create'] = convertTsToDate(swap['timestamp_create'])
                    swap['timestamp_swap'] = convertTsToDate(swap['timestamp_swap'])
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
                    setSwapsLoadingCount(swap['id'])
                })
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

    const onClickView = (swap) => {
        history.push("/swap/" + swap['id'])
    }

    const filterOutSameContract = (list) => {
        return list.filter(item => {
            return item.maker.contract !== item.taker.contract
        })
    }

    const getAllSwaps = async () => {
        getSwapsAsync(1).then(() => {
            setFinishedLoadingSwaps(true)
            getAllSwapDetails(pendingSwapsList).then(result => {
                setFinishedLoadingPending(true)
                setPendingSwapsFull(filterOutSameContract(result.reverse()))
                getAllSwapDetails(successSwapsList).then(result => {
                    setFinishedLoadingSuccess(true)
                    setSuccessSwapsFull(filterOutSameContract(result.reverse()))
                })
            })
        })
    }

    const getPrice = (o1, o2) => {
        return parseFloat(
            IconConverter.toBigNumber(o1['amount'])
                .dividedBy(IconConverter.toBigNumber(o2['amount']))
                .toFixed(8)).toString()
    }

    Object.keys(swapsList).length === 0 && getAllSwaps()

    const loadingText = !finishedLoadingSwaps ?
        'Loading Swaps (' + swapsLoadingCount + ')...'
        : !finishedLoadingSuccess ?
            'Loading pending swaps ...'
            : 'Loading filled swaps ...'

    const over = finishedLoadingSwaps && finishedLoadingPending && finishedLoadingSuccess

    return (
        <>
            <LoadingOverlay over={over} text={loadingText} />
            {errorUi && <InfoBox setErrorUi={setErrorUi} type={"error"} content={"An error occured : " + errorUi} />}
            {finishedLoadingSwaps &&

                <div id="list-swap-root">
                    {over && <>
                        <div id="list-swap-container">
                            <div className="container-swaps-item">
                                <div className="container-swaps-item-container">
                                    <div className="list-swap-title">Pending Swaps</div>

                                    <div className="swaps-table-view">
                                        <table className="swaps-table" cellSpacing='0'>

                                            <thead>
                                                <tr>
                                                    <th>Offer</th>
                                                    <th>Receive</th>
                                                    <th>Price</th>
                                                    <th>Creation</th>
                                                    <th>Action</th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {pendingSwapsFull && Object.keys(pendingSwapsFull).map(order => (
                                                    <tr key={order}>
                                                        <td>{pendingSwapsFull[order]['maker']['amountDisplay'] + " " + pendingSwapsFull[order]['maker']['token']['symbol']}</td>
                                                        <td>{pendingSwapsFull[order]['taker']['amountDisplay'] + " " + pendingSwapsFull[order]['taker']['token']['symbol']}</td>
                                                        <td>
                                                            1 {pendingSwapsFull[order]['maker']['token']['symbol']} ≈&nbsp;
                                                {getPrice(pendingSwapsFull[order]['taker'], pendingSwapsFull[order]['maker'])}&nbsp;
                                                {pendingSwapsFull[order]['taker']['token']['symbol']}
                                                            <br />
                                                1 {pendingSwapsFull[order]['taker']['token']['symbol']} ≈&nbsp;
                                                {getPrice(pendingSwapsFull[order]['maker'], pendingSwapsFull[order]['taker'])}&nbsp;
                                                {pendingSwapsFull[order]['maker']['token']['symbol']}
                                                        </td>
                                                        <td>{pendingSwapsFull[order]['timestamp_create']}</td>
                                                        <td className={"open-orders-actions"}>
                                                            <button className={"open-orders-actions-button"}
                                                                onClick={() => { onClickView(pendingSwapsFull[order]) }}>View</button>
                                                        </td>
                                                    </tr>
                                                ))
                                                }
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                            <div className="container-swaps-item">
                                <div className="container-swaps-item-container">
                                    <div className="list-swap-title">Filled Swaps</div>

                                    <div className="swaps-table-view">
                                        <table className="swaps-table" cellSpacing='0'>

                                            <thead>
                                                <tr>
                                                    <th>Offer</th>
                                                    <th>Receive</th>
                                                    <th>Price</th>
                                                    <th>Filled</th>
                                                    <th>Action</th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {successSwapsFull && Object.keys(successSwapsFull).map(order => (
                                                    <tr key={order}>
                                                        <td>
                                                            {successSwapsFull[order]['maker']['amountDisplay'] + " " + successSwapsFull[order]['maker']['token']['symbol']}</td>
                                                        <td>
                                                            {successSwapsFull[order]['taker']['amountDisplay'] + " " + successSwapsFull[order]['taker']['token']['symbol']}</td>
                                                        <td>
                                                            1 {successSwapsFull[order]['maker']['token']['symbol']} ≈&nbsp;
                                                {getPrice(successSwapsFull[order]['taker'], successSwapsFull[order]['maker'])}&nbsp;
                                                {successSwapsFull[order]['taker']['token']['symbol']}
                                                            <br />
                                                1 {successSwapsFull[order]['taker']['token']['symbol']} ≈&nbsp;
                                                {getPrice(successSwapsFull[order]['maker'], successSwapsFull[order]['taker'])}&nbsp;
                                                {successSwapsFull[order]['maker']['token']['symbol']}
                                                        </td>
                                                        <td>{successSwapsFull[order]['timestamp_swap']}</td>
                                                        <td>
                                                            <button className={"open-orders-actions-button"}
                                                                onClick={() => { onClickView(successSwapsFull[order]) }}>View</button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>}
                </div >
            }
        </>
    )
}

export default ListSwap