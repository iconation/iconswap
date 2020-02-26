import React, { useState } from 'react'
import { IconConverter } from 'icon-sdk-js'
import { api } from './API'
import { Redirect } from 'react-router-dom'
import { getTokenDetails } from './utils'
import OrderChoser from './OrderChoser'
import './Homepage.css'
import swapPicture from './static/img/swap.png'

const Homepage = ({ wallet }) => {
    const emptyOrder = {
        contract: null,
        amount: null,
        contractError: null,
        amountError: null,
    }
    const [orders, setOrders] = useState([{ ...emptyOrder }, { ...emptyOrder }])
    const [whitelist, setWhitelist] = useState(null)
    const [swapId, setSwapId] = useState(null)
    const [waitForSwapCreation, setWaitForSwapCreation] = useState(false)

    !whitelist && api.getWhitelist().then(contract => {
        const promises = contract.map(contract => {
            return getTokenDetails(wallet, contract)
        })

        Promise.all(promises).then(whitelist => {
            whitelist = whitelist.reduce(function (map, obj) {
                map[obj.contract] = obj
                return map
            }, {})
            setWhitelist(whitelist)
        })
    })

    const createSwapClicked = () => {
        if (!swappable()) {
            !orders[0].contract && setContractError(0, true);
            !orders[1].contract && setContractError(1, true);
            !orders[0].amount && setAmountError(0, true);
            !orders[1].amount && setAmountError(1, true);
        } else {
            setWaitForSwapCreation(true)
            api.getDecimals(orders[0].contract).then(decimals1 => {
                api.getDecimals(orders[1].contract).then(decimals2 => {
                    const digits1 = IconConverter.toBigNumber('10').exponentiatedBy(decimals1)
                    const digits2 = IconConverter.toBigNumber('10').exponentiatedBy(decimals2)
                    api.createSwap(
                        wallet,
                        orders[0].contract,
                        orders[0].amount * digits1,
                        orders[1].contract,
                        orders[1].amount * digits2)
                        .then(swapInfo => {
                            if (swapInfo) {
                                setSwapId(swapInfo['swapId'])
                            }
                        }).catch((reason) => {
                            console.log(reason)
                        }).finally(() => {
                            setWaitForSwapCreation(false)
                        })
                })
            })
        }
    }

    const swappable = () => {
        return orders[0].contract && orders[1].contract && orders[0].amount && orders[1].contract
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

    return (
        <>
            {swapId && <Redirect to={"/swap/" + swapId} />}

            {!whitelist && <>
                <div className="overlay">
                    <div className="overlayText">
                        Loading, please wait...
                    </div>
                </div>
            </>}

            {waitForSwapCreation && <>
                <div className="overlay">
                    <div className="overlayText">
                        Creating Swap, please wait...
                    </div>
                </div>
            </>}

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

            {whitelist && <div className="center">
                <div className="swapLogo"><img src={swapPicture} height="60" alt="logo" /></div>
            </div>}

            {whitelist && <div className="centerbot">
                <button className={"flatbutton bigbutton"}
                    onClick={() => createSwapClicked()}>
                    Create Swap
             </button>
            </div>}
        </>
    )
}

export default Homepage