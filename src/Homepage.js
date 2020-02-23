import React, { useState } from 'react'
import { IconConverter } from 'icon-sdk-js'
import { api } from './API'
import { Redirect } from 'react-router-dom'
import { getTokenDetails } from './utils'

const Homepage = ({ wallet }) => {

    const [whitelist, setWhitelist] = useState(null)
    const [contract1, setContract1] = useState(null)
    const [amount1, setAmount1] = useState(null)
    const [contract2, setContract2] = useState(null)
    const [amount2, setAmount2] = useState(null)
    const [swapId, setSwapId] = useState(null)
    const [waitForSwapCreation, setWaitForSwapCreation] = useState(false)

    !whitelist && api.getWhitelist().then(contract => {
        const promises = contract.map(contract => {
            return getTokenDetails(contract)
        })

        Promise.all(promises).then(whitelist => {
            setContract1(whitelist[0])
            setContract2(whitelist[0])
            whitelist = whitelist.reduce(function (map, obj) {
                map[obj.contract] = obj
                return map
            }, {})
            setWhitelist(whitelist)
        })
    })

    const createSwapClicked = () => {
        setWaitForSwapCreation(true)
        api.getDecimals(contract1.contract).then(decimals1 => {
            api.getDecimals(contract2.contract).then(decimals2 => {
                const digits1 = IconConverter.toBigNumber('10').exponentiatedBy(decimals1)
                const digits2 = IconConverter.toBigNumber('10').exponentiatedBy(decimals2)
                api.createSwap(
                    wallet,
                    contract1.contract,
                    amount1 * digits1,
                    contract2.contract,
                    amount2 * digits2)
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
        return contract1 && contract2 && amount1 && amount2
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
                    {whitelist && <>
                        <p>Choose a token :</p>
                        <select id="tokens1"
                            onChange={() => setContract1(whitelist[document.getElementById('tokens1').value])}>

                            {Object.keys(whitelist).map((key) => (
                                <option key={whitelist[key].contract} value={whitelist[key].contract}>
                                    {whitelist[key].name} ({whitelist[key].symbol})
                        </option>
                            ))}

                        </select>

                        <p>Choose the amount :</p>
                        <input id="amount1" onChange={() => setAmount1(document.getElementById('amount1').value)}>
                        </input>
                    </>}
                </div>
            </div>

            <div className="split right">
                <div className="centered">
                    {whitelist && <>
                        <p>Choose a token :</p>
                        <select id="tokens2"
                            onChange={() => setContract2(whitelist[document.getElementById('tokens2').value])}>

                            {Object.keys(whitelist).map((key) => (
                                <option key={whitelist[key].contract} value={whitelist[key].contract}>
                                    {whitelist[key].name} ({whitelist[key].symbol})
                        </option>
                            ))}

                        </select>

                        <p>Choose the amount :</p>
                        <input id="amount2" onChange={() => setAmount2(document.getElementById('amount2').value)}>
                        </input>
                    </>}
                </div>
            </div>

            {swappable() &&
                <div className="center">
                    <button className="flatbutton bigbutton"
                        onClick={() => createSwapClicked()}>
                        Create Swap
                        </button>
                </div>
            }
        </>
    )
}

export default Homepage