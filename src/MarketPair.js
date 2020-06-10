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
    const [isInverted, setIsInverted] = useState(null)

    // HackFix
    const [appVersion, setAppVersion] = useState(null)
    !appVersion && api.getVersion().then(version => {
        setAppVersion(version)
    })

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

    const refreshMarket = () => {

        let promises = [
            api.getBalance(wallet, pairs[0]),
            api.getBalance(wallet, pairs[1]),
            api.getMarketBuyersPendingSwaps(pairName),
            api.getMarketSellerPendingSwaps(pairName),
            api.getDecimals(pairs[0]),
            api.getDecimals(pairs[1]),
            api.tokenSymbol(pairs[0]),
            api.tokenSymbol(pairs[1]),
            api.getManyMarketFilledSwaps(pairName, 0, 1500)
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

    useEffect(() => {
        refreshMarket()
    }, [pairs]);

    useEffect(() => {
        switch (chartView) {
            case 'price':
                showPriceChart(market, pairs, isInverted);
                break;

            case 'depth':
                showDepthChart(market, pairs, isInverted);
                break;
        }
    }, [market, chartView]);

    const goToSwap = (swap) => {
        window.open("#/swap/" + parseInt(swap['id'], 16), '_blank')
    }

    const selectPercentWallet = (percentValue, sideSell) => {
        const indexBalance = sideSell ? 0 : 1
        const amount = IconConverter.toBigNumber(balances[indexBalance]).multipliedBy(percentValue).dividedBy(100)

        if (sideSell) {
            sellAmountInput.current.value = balanceToUnitDisplay(amount, decimals[indexBalance])
        } else {
            buyAmountInput.current.value = balanceToUnitDisplay(amount, decimals[indexBalance])
        }

        makerOrderFieldChange(sideSell, FormIndexes.AMOUNT_FORM_INDEX)
    }

    const makerOrderFieldChange = (sideSell, indexChanged) => {

        const priceInput = (sideSell ? sellPriceInput : buyPriceInput)
        const amountInput = (sideSell ? sellAmountInput : buyAmountInput)
        const totalInput = (sideSell ? sellTotalInput : buyTotalInput)

        const isInputEmpty = (input) => {
            return input.current.value.length == 0
        }

        var price = parseFloat(priceInput.current.value)
        var amount = parseFloat(amountInput.current.value)
        var total = parseFloat(totalInput.current.value)

        switch (indexChanged) {
            case FormIndexes.PRICE_FORM_INDEX: // price
                if (isInputEmpty(priceInput) || isInputEmpty(amountInput)) break
                total = IconConverter.toBigNumber(amount).multipliedBy(IconConverter.toBigNumber(price))
                break
            case FormIndexes.AMOUNT_FORM_INDEX: // amount
                if (isInputEmpty(priceInput) || isInputEmpty(amountInput)) break
                total = IconConverter.toBigNumber(amount).multipliedBy(IconConverter.toBigNumber(price))
                break
            case FormIndexes.TOTAL_FORM_INDEX: // total
                if (isInputEmpty(priceInput) || isInputEmpty(totalInput)) break
                amount = IconConverter.toBigNumber(total).dividedBy(IconConverter.toBigNumber(price))
                break
        }

        priceInput.current.value = price ? truncateDecimals(price, 8) : price === 0 ? '0' : ''
        amountInput.current.value = amount ? truncateDecimals(amount, 4) : amount === 0 ? '0' : ''
        totalInput.current.value = total ? truncateDecimals(total, 4) : total === 0 ? '0' : ''
    }

    const clickOnBookOrder = (swap, index, swaps, sideSell) => {
        const price = getPriceBigNumber(swap, pairs)
        buyPriceInput.current.value = displayBigNumber(price);
        sellPriceInput.current.value = displayBigNumber(price);

        // Get amount
        var amount = IconConverter.toBigNumber(0);
        if (sideSell) {
            for (var curIndex = index; curIndex < swaps.length; curIndex++) {
                amount = amount.plus(IconConverter.toBigNumber(swaps[curIndex]['maker']['amount']))
            }

        } else {
            for (var curIndex = index; curIndex >= 0; curIndex--) {
                amount = amount.plus(IconConverter.toBigNumber(swaps[curIndex]['taker']['amount']))
            }
        }

        // Check if amount exceed balance
        const indexBalance = sideSell ? 1 : 0
        const balance = IconConverter.toBigNumber(balances[indexBalance])
        console.log("-----------------------------")
        console.log("pre amount ", balanceToUnitDisplay(amount, decimals[indexBalance]))
        console.log("pre balance ", balanceToUnitDisplay(balance, decimals[indexBalance]))
        if (sideSell) {
            console.log("<")
            const total = amount.multipliedBy(price)
            console.log("pre total", balanceToUnitDisplay(total, decimals[indexBalance]))

            if (total.comparedTo(balance) == 1) {
                amount = IconConverter.toBigNumber(balance).dividedBy(IconConverter.toBigNumber(price))
            }
        } else {
            console.log(">")
            if (amount.comparedTo(balance) == 1) {
                amount = balance
            }
        }
        console.log("aft amount ", balanceToUnitDisplay(amount, decimals[indexBalance]))

        amount = balanceToUnit(amount, decimals[indexBalance])

        if (sideSell) {
            buyAmountInput.current.value = amount
        } else {
            sellAmountInput.current.value = amount
        }

        makerOrderFieldChange(!sideSell, FormIndexes.AMOUNT_FORM_INDEX)
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
                                <tbody id={appVersion == '0.4.0' ? "" : "market-pair-sellers-entries"}>
                                    {sellers && sellers.map((swap, index) => (
                                        <tr className="market-pair-tr-clickeable" onClick={() => { goToSwap(swap) }} key={swap['id']}>
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
                                <div id="market-pair-spread">Spread: <br /> {
                                    // Temp
                                    appVersion && appVersion == '0.4.0' ?
                                        getSpread(sellers.slice(-1)[0], buyers[0], pairs)
                                        : getSpread(sellers[0], buyers[0], pairs)
                                } %</div>
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
                                        <tr className="market-pair-tr-clickeable" onClick={() => { goToSwap(swap) }} key={swap['id']}>
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

                            {/*
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

                                        <button className="market-pair-buysell-button market-pair-buy-button">Buy {symbols[pairs[0]]}</button>
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

                                        <button className="market-pair-buysell-button market-pair-sell-button">Sell {symbols[pairs[0]]}</button>

                                    </div>
                                </div>
                            </div>
                            */}
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