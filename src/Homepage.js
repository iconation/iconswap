import React, { useState } from 'react'
import { IconConverter } from 'icon-sdk-js'
import { api } from './API'
import OrderChoser from './OrderChoser'
import './Homepage.css'
import swapPicture from './static/img/swap.png'
import { useHistory } from 'react-router-dom'
import InfoBox from './InfoBox'
import LoadingOverlay from './LoadingOverlay'
import SwapSvg from './static/svg/SwapSvg.js'

const Homepage = ({ wallet }) => {
    const emptyOrder = {
        contract: null,
        amount: null,
        contractError: null,
        amountError: null,
    }
    const [orders, setOrders] = useState([{ ...emptyOrder }, { ...emptyOrder }])
    const [whitelist, setWhitelist] = useState(null)
    const [waitForSwapCreation, setWaitForSwapCreation] = useState(false)
    const [errorUi, setErrorUi] = useState(null)

    const maker = orders[0]
    const taker = orders[1]

    const history = useHistory();

    !whitelist && api.getWhitelist().then(contract => {
        const promises = contract.map(contract => {
            return api.getTokenDetails(wallet, contract)
        })

        Promise.all(promises).then(whitelist => {
            whitelist = whitelist.reduce(function (map, obj) {
                map[obj.contract] = obj
                return map
            }, {})
            setWhitelist(whitelist)
        }).catch((error) => {
            setErrorUi(error)
        })
    })

    const createSwapClicked = () => {
        if (!swappable()) {
            // Highlight form that hasn't been filled correctly
            !maker.contract && setContractError(0, true);
            !taker.contract && setContractError(1, true);
            !maker.amount && setAmountError(0, true);
            !taker.amount && setAmountError(1, true);
        } else {
            setWaitForSwapCreation(true)
            api.getDecimals(maker.contract).then(decimals_maker => {
                api.getDecimals(taker.contract).then(decimals_taker => {
                    api.createSwap(
                        wallet,
                        maker.contract,
                        maker.amount * IconConverter.toBigNumber('10').exponentiatedBy(decimals_maker),
                        taker.contract,
                        taker.amount * IconConverter.toBigNumber('10').exponentiatedBy(decimals_taker)
                    ).then(swapInfo => {
                        if (swapInfo) {
                            history.push("/swap/" + swapInfo['swapId']);
                            setWaitForSwapCreation(false)
                        }
                    }).finally(() => {
                        setWaitForSwapCreation(false)
                    })
                })
            }).catch((error) => {
                setErrorUi(error)
            })
        }
    }

    const swappable = () => {
        return maker.contract && taker.contract && orders[0].amount && taker.contract
    }

    const setContract = (index, value) => {
        let newOrders = [...orders]
        newOrders[index].contract = value
        setOrders(newOrders)
        setContractError(index, false)
    }

    const setContractError = (index, value) => {
        let newOrders = [...orders]
        newOrders[index].contractError = value
        setOrders(newOrders)
    }

    const setAmount = (index, value) => {
        let newOrders = [...orders]
        newOrders[index].amount = value
        setOrders(newOrders)
    }

    const setAmountError = (index, value) => {
        let newOrders = [...orders]
        newOrders[index].amountError = value
        setOrders(newOrders)
    }

    const loadingText = waitForSwapCreation ? 'Creating Swap, please wait...' : 'Loading wallet...'
    const over = (whitelist !== null)

    return (
        <>
            <LoadingOverlay over={over && !waitForSwapCreation} text={loadingText} />
            {errorUi && <InfoBox setErrorUi={setErrorUi} type={"error"} content={"An error occured : " + errorUi} />}

            {over && <>

                <div className="split left">
                    <div className="centered">
                        <OrderChoser
                            whitelist={whitelist}
                            setContract={setContract}
                            setAmount={setAmount}
                            titleText={"I am offering"}
                            orders={orders}
                            index={0} />
                    </div>
                </div>

                <div className="split right">
                    <div className="centered">
                        <OrderChoser
                            whitelist={whitelist}
                            setContract={setContract}
                            setAmount={setAmount}
                            titleText={"I am receiving"}
                            orders={orders}
                            index={1} />
                    </div>
                </div>

                {whitelist && <div className="center swap-logo">
                    <img src={swapPicture} height="60" alt="logo" />
                </div>}

                {whitelist && <div className="center-bottom">
                    <button className="big-button button-svg-container" onClick={() => { createSwapClicked() }}>
                        <SwapSvg />
                        <div className="svg-text-button">Create Swap</div>
                    </button>
                </div>}
            </>}
        </>
    )
}

export default Homepage