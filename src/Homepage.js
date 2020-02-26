import React, { useState } from 'react'
import { IconConverter } from 'icon-sdk-js'
import { api } from './API'
import { Redirect } from 'react-router-dom'
import { getTokenDetails } from './utils'
import OrderChoser from './OrderChoser'
import './Homepage.css'
import swapPicture from './static/img/swap.png'

const Homepage = ({ wallet }) => {

    const [whitelist, setWhitelist] = useState(null)
    const [contracts, setContracts] = useState([null, null])
    const [amounts, setAmounts] = useState([null, null])
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
        setWaitForSwapCreation(true)
        api.getDecimals(contracts[0]).then(decimals1 => {
            api.getDecimals(contracts[1]).then(decimals2 => {
                const digits1 = IconConverter.toBigNumber('10').exponentiatedBy(decimals1)
                const digits2 = IconConverter.toBigNumber('10').exponentiatedBy(decimals2)
                api.createSwap(
                    wallet,
                    contracts[0],
                    amounts[0] * digits1,
                    contracts[1],
                    amounts[1] * digits2)
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

    const swappable = () => {
        return contracts && amounts && contracts[0] && contracts[1] && amounts[0] && amounts[1]
    }

    const setContractOnChange = (index, value) => {
        let newContracts = [...contracts]
        newContracts[index] = value
        setContracts(newContracts)
    }

    const setAmountOnChange = (index, value) => {
        let newAmounts = [...amounts]
        newAmounts[index] = value
        setAmounts(newAmounts)
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
                        setContractOnChange={(index, value) => { setContractOnChange(index, value) }}
                        setAmountOnChange={setAmountOnChange}
                        titleText={"I am offering"}
                        index={0} />
                </div>
            </div>

            <div className="split right">
                <div className="centered">
                    <OrderChoser
                        whitelist={whitelist}
                        setContractOnChange={setContractOnChange}
                        setAmountOnChange={setAmountOnChange}
                        titleText={"I am receiving"}
                        index={1} />
                </div>
            </div>

            {whitelist && <div className="center">
                <div className="swapLogo"><img src={swapPicture} height="60" alt="logo" /></div>
            </div>}

            {whitelist && <div className="centerbot">
                <button className="flatbutton bigbutton"
                    disabled={!swappable()}
                    onClick={() => createSwapClicked()}>
                    Create Swap
             </button>
            </div>}
        </>
    )
}

export default Homepage