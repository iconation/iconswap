import React, { useState, useEffect, useRef } from 'react'
import LoadingOverlay from './LoadingOverlay'
import { api } from './API'
import './MarketPair.css'
import { useHistory } from 'react-router-dom';
import { showPriceChart, showDepthChart } from './MarketCharts'
import {
    convertTsToDate,
    displayBigNumber,
    balanceToUnit,
    balanceToUnitDisplay,
    isBuyer,
    getPriceBigNumber,
    getPrice,
    truncateDecimals
} from './utils'
import { IconConverter } from 'icon-sdk-js'
import { ReactComponent as WalletSvg } from './static/svg/Wallet.svg'
import { ReactComponent as SwapSpotSvg } from './static/svg/SwapSpot.svg'


const MarketPair = ({ match, wallet }) => {

    const history = useHistory();

    const [pairs, setPairs] = useState([match.params.pair1, match.params.pair2])
    const [buyers, setBuyers] = useState(null)
    const [sellers, setSellers] = useState(null)
    const [decimals, setDecimals] = useState(null)
    const [symbols, setSymbols] = useState(null)
    const [swapsFilled, setSwapsFilled] = useState(null)
    const [market, setMarket] = useState(null)
    const [chartView, setChartView] = useState('price')
    const [balances, setBalances] = useState([0, 0])
    const [isInverted, setIsInverted] = useState(false)

    const buyPriceInput = useRef(null)
    const buyAmountInput = useRef(null)
    const buyTotalInput = useRef(null)
    const sellPriceInput = useRef(null)
    const sellAmountInput = useRef(null)
    const sellTotalInput = useRef(null)

    const pairName = pairs.join('/')

    const FormIndexes = {
        PRICE_FORM_INDEX: 0,
        AMOUNT_FORM_INDEX: 1,
        TOTAL_FORM_INDEX: 2,
    }

    useEffect(() => {

        const groupSwaps = (swaps) => {
            if (swaps.length === 0) return swaps

            // Group swaps in a dict with a price key
            let dictionary = {}
            swaps.forEach(swap => {
                if (!(getPrice(swap, pairs) in dictionary)) {
                    dictionary[getPrice(swap, pairs)] = [swap]
                } else {
                    dictionary[getPrice(swap, pairs)].push(swap)
                }
            })

            var result = []

            // Sort keys by value
            const sortedKeys = Object.keys(dictionary).sort((a, b) => {
                return parseFloat(a) - parseFloat(b)
            })

            // Iterate the dictionary
            sortedKeys.forEach((key, index) => {
                const swapsPrice = dictionary[key]
                var sumSwap = swapsPrice.reduce((acc, cur) => {
                    acc['maker']['amount'] = IconConverter.toHex(IconConverter.toBigNumber(acc['maker']['amount'])
                        .plus(cur['maker']['amount']))
                    acc['taker']['amount'] = IconConverter.toHex(IconConverter.toBigNumber(acc['taker']['amount'])
                        .plus(IconConverter.toBigNumber(cur['taker']['amount'])))
                    return acc
                })
                result.push(sumSwap)
            })

            return result
        }

        const refreshMarket = () => {

            let promises = [
                api.getBalance(wallet, pairs[0]),
                api.getBalance(wallet, pairs[1]),
                api.getMarketBuyersPendingSwaps(pairName).then(s => groupSwaps(s)),
                api.getMarketSellerPendingSwaps(pairName).then(s => groupSwaps(s)),
                api.getDecimals(pairs[0]),
                api.getDecimals(pairs[1]),
                api.tokenSymbol(pairs[0]),
                api.tokenSymbol(pairs[1]),
                api.getManyMarketFilledSwaps(pairName, 0, 1300)
            ]

            return Promise.all(promises).then(async market => {
                const [
                    balance1, balance2,
                    buyers, sellers,
                    decimal1, decimal2,
                    symbol1, symbol2,
                    history
                ] = market

                // Check if inverted view
                if (buyers.length !== 0) {
                    if (buyers[0].maker.contract === pairs[1]) {
                        setBuyers(buyers)
                        setSellers(sellers)
                        setIsInverted(false)
                    } else {
                        // inverted
                        setBuyers(sellers)
                        setSellers(buyers)
                        setIsInverted(true)
                    }
                }
                else if (sellers.length !== 0) {
                    if (sellers[0].maker.contract === pairs[0]) {
                        setBuyers(buyers)
                        setSellers(sellers)
                        setIsInverted(false)
                    } else {
                        // inverted
                        setBuyers(sellers)
                        setSellers(buyers)
                        setIsInverted(true)
                    }
                }

                setBalances([balance1, balance2])
                setSwapsFilled(history.slice(0, 250))
                setDecimals([decimal1, decimal2])
                let symbols = {}
                symbols[pairs[0]] = symbol1
                symbols[pairs[1]] = symbol2
                setSymbols(symbols)
                setMarket(market)
            })
        }

        refreshMarket()
    }, [pairs, pairName, wallet]);

    useEffect(() => {
        switch (chartView) {
            case 'price':
                showPriceChart(market, pairs, isInverted);
                break;

            case 'depth':
                showDepthChart(market, pairs, isInverted);
                break;

            default:
                console.error("Undefined chartview mode")
        }
    }, [market, chartView, isInverted, pairs]);

    const goToSwap = (swap) => {
        window.open("#/swap/" + parseInt(swap['id'], 16), '_blank')
    }

    const selectPercentWallet = (percentValue, sideSell) => {
        const indexBalance = sideSell ? 0 : 1

        if (sideSell) {
            const amount = IconConverter.toBigNumber(balances[indexBalance]).multipliedBy(percentValue).dividedBy(100)
            sellAmountInput.current.value = parseFloat(balanceToUnitDisplay(amount, decimals[indexBalance]).trim())
            makerOrderFieldChange(sideSell, FormIndexes.AMOUNT_FORM_INDEX)
        } else {
            const total = IconConverter.toBigNumber(balances[indexBalance]).multipliedBy(percentValue).dividedBy(100)
            buyTotalInput.current.value = parseFloat(balanceToUnitDisplay(total, decimals[indexBalance]).trim())
            makerOrderFieldChange(sideSell, FormIndexes.TOTAL_FORM_INDEX)
        }
    }

    const sanitizeOrderFieldInputs = (sideSell, price = null, amount = null, total = null) => {

        const priceInput = (sideSell ? sellPriceInput : buyPriceInput)
        const amountInput = (sideSell ? sellAmountInput : buyAmountInput)
        const totalInput = (sideSell ? sellTotalInput : buyTotalInput)

        if (price !== null) priceInput.current.value = price ? truncateDecimals(price, 7) : price === 0 ? '0' : ''
        if (amount !== null) amountInput.current.value = amount ? truncateDecimals(amount, 7) : amount === 0 ? '0' : ''
        if (total !== null) totalInput.current.value = total ? truncateDecimals(total, 7) : total === 0 ? '0' : ''
    }

    const makerOrderFieldChange = (sideSell, indexChanged) => {

        const priceInput = (sideSell ? sellPriceInput : buyPriceInput)
        const amountInput = (sideSell ? sellAmountInput : buyAmountInput)
        const totalInput = (sideSell ? sellTotalInput : buyTotalInput)

        const isInputEmpty = (input) => {
            return input.current.value.length === 0
        }

        var price = parseFloat(priceInput.current.value)
        var amount = parseFloat(amountInput.current.value)
        var total = parseFloat(totalInput.current.value)

        switch (indexChanged) {
            case FormIndexes.PRICE_FORM_INDEX: // price
                if (isInputEmpty(priceInput) || isInputEmpty(amountInput)) break
                total = parseFloat(IconConverter.toBigNumber(amount).multipliedBy(IconConverter.toBigNumber(price)))
                sanitizeOrderFieldInputs(sideSell, null, null, total)
                break
            case FormIndexes.AMOUNT_FORM_INDEX: // amount
                if (isInputEmpty(priceInput) || isInputEmpty(amountInput)) break
                total = parseFloat(IconConverter.toBigNumber(amount).multipliedBy(IconConverter.toBigNumber(price)))
                sanitizeOrderFieldInputs(sideSell, null, null, total)
                break
            case FormIndexes.TOTAL_FORM_INDEX: // total
                if (isInputEmpty(priceInput) || isInputEmpty(totalInput)) break
                amount = parseFloat(IconConverter.toBigNumber(total).dividedBy(IconConverter.toBigNumber(price)))
                sanitizeOrderFieldInputs(sideSell, null, amount)
                break
            default:
                console.error("makerOrderFieldChange: Invalid index")
        }
    }

    const clickOrderLimit = (sideSell) => {

        const amountInput = (sideSell ? sellAmountInput : buyAmountInput)
        const totalInput = (sideSell ? sellTotalInput : buyTotalInput)

        const maker_amount = sideSell ? parseFloat(amountInput.current.value) : parseFloat(totalInput.current.value)
        const taker_amount = sideSell ? parseFloat(totalInput.current.value) : parseFloat(amountInput.current.value)

        const maker_contract = sideSell ? pairs[0] : pairs[1]
        const taker_contract = sideSell ? pairs[1] : pairs[0]

        api.marketCreateLimitOrder(wallet, maker_contract, maker_amount, taker_contract, taker_amount)
    }

    const clickOnBookOrder = (swap, index, swaps, sideSell) => {
        const price = getPriceBigNumber(swap, pairs)

        // Get amount
        var amount = IconConverter.toBigNumber(0);
        const sideOrder = sideSell ? 'maker' : 'taker'
        for (var curIndex = index; curIndex >= 0; curIndex--) {
            amount = amount.plus(IconConverter.toBigNumber(swaps[curIndex][sideOrder]['amount']))
        }

        // Check if amount exceed balance
        const indexBalance = sideSell ? 1 : 0
        const balance = IconConverter.toBigNumber(balances[indexBalance])
        if (sideSell) {
            const total = amount.multipliedBy(price)
            if (total.comparedTo(balance) === 1) {
                amount = IconConverter.toBigNumber(balance).dividedBy(IconConverter.toBigNumber(price))
            }
        } else {
            if (amount.comparedTo(balance) === 1) {
                amount = balance
            }
        }

        const total = amount.multipliedBy(price)
        sanitizeOrderFieldInputs(!sideSell,
            parseFloat(price),
            parseFloat(balanceToUnit(amount, decimals[0])),
            parseFloat(balanceToUnit(total, decimals[1]))
        )
    }

    const getSpread = (swapBid, swapAsk, pairs) => {
        if (!swapBid | !swapAsk) return 0;

        const bid = getPriceBigNumber(swapBid, pairs)
        const ask = getPriceBigNumber(swapAsk, pairs)
        return displayBigNumber(bid.minus(ask).dividedBy(ask.plus(bid).dividedBy(2)).multipliedBy(100).abs())
    }

    const swapSpot = () => {
        history.push("/market/" + pairs[1] + "/" + pairs[0])
        setBuyers(null)
        setPairs([pairs[1], pairs[0]])
    }

    const isUserSwap = (swap) => {
        return (swap.maker.provider === wallet || swap.taker.provider === wallet)
    }

    const over = buyers && sellers && decimals && symbols
    const loadingText = 'Loading Market...'

    return (<>
        <LoadingOverlay over={over} text={loadingText} />

        <div id="market-pair-root">
            {over && <>
                <div id="market-pair-container">
                    <div id="market-pair-title">

                        {symbols[pairs[0]]}/{symbols[pairs[1]]}

                        <button id="market-pair-swap-spots" className="big-button button-svg-container tooltip"
                            onClick={() => { swapSpot() }}>
                            <div className="svg-icon-button"><SwapSpotSvg /></div>
                        </button>

                    </div>

                    <div id="market-pair-view">
                        <div id="market-pair-left">
                            <table id="market-pair-sellers" className="market-pair-table">
                                <tbody id="market-pair-sellers-entries">
                                    {sellers && sellers.map((swap, index) => (
                                        <tr className="market-pair-tr-clickeable" onClick={() => { clickOnBookOrder(swap, index, sellers, true) }} key={swap['id']}>
                                            <td className={"market-pair-left-status tooltip"}>{isUserSwap(swap) && <>
                                                <span className="market-pair-yourswap market-pair-yourswap-seller">⮞</span>
                                                <span className="tooltiptext">You created this swap</span>
                                            </>}
                                            </td>
                                            <td className="market-pair-left-price market-pair-sellers-text" >{getPrice(swap, pairs)}</td>
                                            <td className="market-pair-left-amount">{balanceToUnitDisplay(swap['maker']['amount'], decimals[1])}</td>
                                            <td className="market-pair-left-total">{balanceToUnitDisplay(swap['taker']['amount'], decimals[0])}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <table className="market-pair-table">
                                <thead>
                                    <tr>
                                        <th className="market-pair-left-status"></th>
                                        <th className="market-pair-left-price">Price ({symbols[pairs[1]]}) </th>
                                        <th className="market-pair-left-amount">Amount ({symbols[pairs[0]]})</th>
                                        <th className="market-pair-left-total">Total ({symbols[pairs[1]]})</th>
                                    </tr>
                                </thead>
                            </table>

                            <div id="market-pair-middleinfo">
                                <div id="market-pair-spread">Spread: <br /> {getSpread(sellers[0], buyers[0], pairs)} %</div>
                                <div id="market-pair-lastprice">Last Price : <br /> {(swapsFilled.length > 0 && getPrice(swapsFilled[0], pairs)) || 0}</div>
                            </div>

                            <table className="market-pair-table">
                                <thead>
                                    <tr>
                                        <th className="market-pair-left-status"></th>
                                        <th className="market-pair-left-price">Price ({symbols[pairs[1]]}) </th>
                                        <th className="market-pair-left-amount">Amount ({symbols[pairs[0]]})</th>
                                        <th className="market-pair-left-total">Total ({symbols[pairs[1]]})</th>
                                    </tr>
                                </thead>
                            </table>

                            <table id="market-pair-buyers" className="market-pair-table">
                                <tbody>
                                    {buyers && buyers.map((swap, index) => (
                                        <tr className="market-pair-tr-clickeable" onClick={() => { clickOnBookOrder(swap, index, buyers, false) }} key={swap['id']}>
                                            <td className={"market-pair-left-status tooltip"}>{isUserSwap(swap) && <>
                                                <span className="market-pair-yourswap market-pair-yourswap-buyer">⮞</span>
                                                <span className="tooltiptext tooltiptext-bottom">You created this swap</span>
                                            </>}
                                            </td>
                                            <td className="market-pair-left-price market-pair-buyers-text" >{getPrice(swap, pairs)}</td>
                                            <td className="market-pair-left-amount">{balanceToUnitDisplay(swap['taker']['amount'], decimals[0])}</td>
                                            <td className="market-pair-left-total">{balanceToUnitDisplay(swap['maker']['amount'], decimals[1])}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div id="market-pair-middle">
                            <div id="market-pair-chart">
                                <div id="market-pair-chart-choser">

                                    <button className="small-button tooltip" onClick={() => { setChartView('depth') }}>
                                        Depth
                                    </button>

                                    <button className="small-button tooltip" onClick={() => { setChartView('price') }}>
                                        Price
                                    </button>
                                </div>

                                <div id="market-pair-chart-canvas"></div>
                            </div>


                            <div id="market-pair-make-order">
                                <div id="market-pair-buy-order">
                                    <div className="market-pair-make-order-header">
                                        <div className="market-pair-make-order-title">Buy {symbols[pairs[0]]}</div>

                                        <div className="market-pair-make-order-balance">
                                            <div className="svg-icon-button"><WalletSvg /></div>&nbsp;
                                        {balanceToUnitDisplay(balances[1], decimals[1])} {symbols[pairs[1]]}
                                        </div>
                                    </div>

                                    <div className="market-pair-make-order-fields">
                                        <div className={"market-pair-make-order-hz market-pair-make-order-price"}>
                                            <div className="market-pair-make-order-textfield">Price ({symbols[pairs[1]]}):</div>
                                            <input onChange={() => { makerOrderFieldChange(false, FormIndexes.PRICE_FORM_INDEX) }} ref={buyPriceInput} className="market-pair-make-order-inputfield" type="number"></input>
                                        </div>
                                        <div className={"market-pair-make-order-hz market-pair-make-order-amount"}>
                                            <div className="market-pair-make-order-textfield">Amount ({symbols[pairs[0]]}):</div>
                                            <input onChange={() => { makerOrderFieldChange(false, FormIndexes.AMOUNT_FORM_INDEX) }} ref={buyAmountInput} className="market-pair-make-order-inputfield" type="number"></input>
                                        </div>
                                        <div className={"market-pair-make-order-hz market-pair-make-order-percent"}>
                                            <button onClick={() => { selectPercentWallet(25, false) }} className={"market-pair-percent-button"}>25%</button>
                                            <button onClick={() => { selectPercentWallet(50, false) }} className={"market-pair-percent-button"}>50%</button>
                                            <button onClick={() => { selectPercentWallet(75, false) }} className={"market-pair-percent-button"}>75%</button>
                                            <button onClick={() => { selectPercentWallet(100, false) }} className={"market-pair-percent-button"}>100%</button>
                                        </div>
                                        <div className={"market-pair-make-order-hz market-pair-make-order-total"}>
                                            <div className="market-pair-make-order-textfield">Total ({symbols[pairs[1]]}):</div>
                                            <input onChange={() => { makerOrderFieldChange(false, FormIndexes.TOTAL_FORM_INDEX) }} ref={buyTotalInput} className="market-pair-make-order-inputfield" type="number"></input>
                                        </div>

                                        <button className="market-pair-buysell-button market-pair-buy-button"
                                            onClick={() => { clickOrderLimit(false) }}>
                                            Buy {symbols[pairs[0]]}</button>
                                    </div>
                                </div>

                                <div id="market-pair-sell-order">

                                    <div className="market-pair-make-order-header">
                                        <div className="market-pair-make-order-title">Sell {symbols[pairs[0]]}</div>

                                        <div className="market-pair-make-order-balance">
                                            <div className="svg-icon-button"><WalletSvg /></div>&nbsp;
                                        {balanceToUnitDisplay(balances[0], decimals[0])} {symbols[pairs[0]]}
                                        </div>
                                    </div>

                                    <div className="market-pair-make-order-fields">
                                        <div className={"market-pair-make-order-hz market-pair-make-order-price"}>
                                            <div className="market-pair-make-order-textfield">Price ({symbols[pairs[1]]}):</div>
                                            <input onChange={() => { makerOrderFieldChange(true, FormIndexes.PRICE_FORM_INDEX) }} ref={sellPriceInput} className="market-pair-make-order-inputfield" type="number"></input>
                                        </div>
                                        <div className={"market-pair-make-order-hz market-pair-make-order-amount"}>
                                            <div className="market-pair-make-order-textfield">Amount ({symbols[pairs[0]]}):</div>
                                            <input onChange={() => { makerOrderFieldChange(true, FormIndexes.AMOUNT_FORM_INDEX) }} ref={sellAmountInput} className="market-pair-make-order-inputfield" type="number"></input>
                                        </div>
                                        <div className={"market-pair-make-order-hz market-pair-make-order-percent"}>
                                            <button onClick={() => { selectPercentWallet(25, true) }} className={"market-pair-percent-button"}>25%</button>
                                            <button onClick={() => { selectPercentWallet(50, true) }} className={"market-pair-percent-button"}>50%</button>
                                            <button onClick={() => { selectPercentWallet(75, true) }} className={"market-pair-percent-button"}>75%</button>
                                            <button onClick={() => { selectPercentWallet(100, true) }} className={"market-pair-percent-button"}>100%</button>
                                        </div>
                                        <div className={"market-pair-make-order-hz market-pair-make-order-total"}>
                                            <div className="market-pair-make-order-textfield">Total ({symbols[pairs[1]]}):</div>
                                            <input onChange={() => { makerOrderFieldChange(true, FormIndexes.TOTAL_FORM_INDEX) }} ref={sellTotalInput} className="market-pair-make-order-inputfield" type="number"></input>
                                        </div>

                                        <button className="market-pair-buysell-button market-pair-sell-button"
                                            onClick={() => { clickOrderLimit(true) }}>
                                            Sell {symbols[pairs[0]]}</button>

                                    </div>
                                </div>
                            </div>
                        </div>

                        <div id="market-pair-right">

                            <table className="market-pair-table">
                                <thead>
                                    <tr>
                                        <th className="market-pair-history-price">Price ({symbols[pairs[1]]}) </th>
                                        <th className="market-pair-history-amount">Amount ({symbols[pairs[0]]})</th>
                                        <th className="market-pair-history-total">Total ({symbols[pairs[1]]})</th>
                                        <th className="market-pair-history-filled">Time filled</th>
                                    </tr>
                                </thead>
                            </table>

                            <div id="market-pair-history">
                                <table className="market-pair-table">
                                    <tbody>
                                        {swapsFilled && swapsFilled.map(swap => (
                                            <tr className="market-pair-tr-clickeable" onClick={() => { goToSwap(swap) }} key={swap['id']}>
                                                {isBuyer(swap, pairs) && <>
                                                    <td className="market-pair-history-price market-pair-buyers-text" >{getPrice(swap, pairs)}</td>
                                                    <td className="market-pair-history-amount">{balanceToUnitDisplay(swap['taker']['amount'], decimals[0])}</td>
                                                    <td className="market-pair-history-total">{balanceToUnitDisplay(swap['maker']['amount'], decimals[1])}</td>
                                                    <td className="market-pair-history-filled">{convertTsToDate(swap['timestamp_swap'])}</td>
                                                </>}
                                                {!isBuyer(swap, pairs) && <>
                                                    <td className="market-pair-history-price market-pair-sellers-text" >{getPrice(swap, pairs)}</td>
                                                    <td className="market-pair-history-amount">{balanceToUnitDisplay(swap['maker']['amount'], decimals[1])}</td>
                                                    <td className="market-pair-history-total">{balanceToUnitDisplay(swap['taker']['amount'], decimals[0])}</td>
                                                    <td className="market-pair-history-filled">{convertTsToDate(swap['timestamp_swap'])}</td>
                                                </>}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </>}
        </div>
    </>)
}

export default MarketPair