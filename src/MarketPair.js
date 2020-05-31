import React, { useState, useEffect, useRef } from 'react'
import LoadingOverlay from './LoadingOverlay'
import { api } from './API'
import './MarketPair.css'
import { useHistory } from 'react-router-dom';
import { showPriceChart, showDepthChart } from './MarketViewers'
import {
    convertTsToDate,
    displayBigNumber,
    balanceToUnitDisplay,
    isBuyer,
    getPriceBigNumber,
    getPrice
} from './utils'
import { ReactComponent as SwapSpotSvg } from './static/svg/SwapSpot.svg'


const MarketPair = ({ match, wallet }) => {

    const history = useHistory();

    const scrollSellers = useRef(null);

    const [pairs, setPairs] = useState([match.params.pair1, match.params.pair2])
    const [buyers, setBuyers] = useState(null)
    const [sellers, setSellers] = useState(null)
    const [decimals, setDecimals] = useState(null)
    const [symbols, setSymbols] = useState(null)
    const [swapsFilled, setSwapsFilled] = useState(null)
    const [market, setMarket] = useState(null)
    const [chartView, setChartView] = useState('price')

    const pairName = pairs.join('/')

    const refreshData = () => {

        let promises = [
            api.getMarketBuyersPendingSwaps(pairName),
            api.getMarketSellerPendingSwaps(pairName),
            api.getDecimals(pairs[0]),
            api.getDecimals(pairs[1]),
            api.tokenSymbol(pairs[0]),
            api.tokenSymbol(pairs[1]),
            api.getManyMarketFilledSwaps(pairName, 0, 500)
        ]

        return Promise.all(promises).then(results => {
            const [
                buyers, sellers,
                decimal1, decimal2,
                symbol1, symbol2,
                history
            ] = results

            // Check if inverted view
            if (buyers.length !== 0) {
                if (buyers[0].maker.contract === pairs[1]) {
                    setBuyers(buyers)
                    setSellers(sellers)
                    results.push(false)
                } else {
                    // inverted
                    setBuyers(sellers.reverse())
                    setSellers(buyers.reverse())
                    results.push(true)
                }
            }
            else if (sellers.length !== 0) {
                if (sellers[0].maker.contract === pairs[0]) {
                    setBuyers(buyers)
                    setSellers(sellers)
                    results.push(false)
                } else {
                    // inverted
                    setBuyers(sellers.reverse())
                    setSellers(buyers.reverse())
                    results.push(true)
                }
            }

            setSwapsFilled(history)
            setDecimals([decimal1, decimal2])
            let symbols = {}
            symbols[pairs[0]] = symbol1
            symbols[pairs[1]] = symbol2
            setSymbols(symbols)
            scrollSellersToBottom()
            setMarket(results)
        })
    }

    useEffect(() => {
        refreshData()
    }, [pairs]);

    useEffect(() => {
        switch (chartView) {
            case 'price':
                showPriceChart(market, pairs);
                break;

            case 'depth':
                showDepthChart(market, pairs);
                break;
        }
    }, [market, chartView]);

    const scrollSellersToBottom = () => {
        const div = scrollSellers.current;
        if (div) {
            div.scrollTop = div.scrollHeight;
        }
    }

    const goToSwap = (swap) => {
        window.open("#/swap/" + parseInt(swap['id'], 16), '_blank')
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
                            <span className="tooltiptext">Show {symbols[pairs[1]]} / {symbols[pairs[0]]}</span>
                            <div className="svg-icon-button"><SwapSpotSvg /></div>
                        </button>

                    </div>

                    <div id="market-pair-view">
                        <div id="market-pair-orderbook">

                            <div ref={scrollSellers} id="market-pair-sellers">
                                <table className="market-pair-table-content market-pair-table" id="seller-table">
                                    <tbody>
                                        {sellers && sellers.map(swap => (
                                            <tr className="market-pair-tr-clickeable" onClick={() => { goToSwap(swap) }} key={swap['id']}>
                                                <td className={"market-pair-orderbook-status tooltip"}>{isUserSwap(swap) && <>
                                                    <span className="market-pair-yourswap market-pair-yourswap-seller">⮞</span>
                                                    <span className="tooltiptext">You created this swap</span>
                                                </>}
                                                </td>
                                                <td className="market-pair-orderbook-price market-pair-sellers-text" >{getPrice(swap, pairs)}</td>
                                                <td className="market-pair-orderbook-amount">{balanceToUnitDisplay(swap['maker']['amount'], decimals[1])}</td>
                                                <td className="market-pair-orderbook-total">{balanceToUnitDisplay(swap['taker']['amount'], decimals[0])}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <div id="seller-anchor"></div>
                            </div>

                            <table className="market-pair-table">
                                <thead>
                                    <tr>
                                        <th className="market-pair-orderbook-status"></th>
                                        <th className="market-pair-orderbook-price">Price ({symbols[pairs[1]]}) </th>
                                        <th className="market-pair-orderbook-amount">Amount ({symbols[pairs[0]]})</th>
                                        <th className="market-pair-orderbook-total">Total ({symbols[pairs[1]]})</th>
                                    </tr>
                                </thead>
                            </table>

                            <div id="market-pair-middleinfo">
                                <div id="market-pair-spread">Spread: <br /> {getSpread(sellers.slice(-1)[0], buyers[0], pairs)} %</div>
                                <div id="market-pair-lastprice">Last Price : <br /> {(swapsFilled.length > 0 && getPrice(swapsFilled[0], pairs)) || 0}</div>
                            </div>

                            <table className="market-pair-table">
                                <thead>
                                    <tr>
                                        <th className="market-pair-orderbook-status"></th>
                                        <th className="market-pair-orderbook-price">Price ({symbols[pairs[1]]}) </th>
                                        <th className="market-pair-orderbook-amount">Amount ({symbols[pairs[0]]})</th>
                                        <th className="market-pair-orderbook-total">Total ({symbols[pairs[1]]})</th>
                                    </tr>
                                </thead>
                            </table>

                            <div id="market-pair-buyers">
                                <table className="market-pair-table">
                                    <tbody>
                                        {buyers && buyers.map(swap => (
                                            <tr className="market-pair-tr-clickeable" onClick={() => { goToSwap(swap) }} key={swap['id']}>
                                                <td className={"market-pair-orderbook-status tooltip"}>{isUserSwap(swap) && <>
                                                    <span className="market-pair-yourswap market-pair-yourswap-buyer">⮞</span>
                                                    <span className="tooltiptext tooltiptext-bottom">You created this swap</span>
                                                </>}
                                                </td>
                                                <td className="market-pair-orderbook-price market-pair-buyers-text" >{getPrice(swap, pairs)}</td>
                                                <td className="market-pair-orderbook-amount">{balanceToUnitDisplay(swap['taker']['amount'], decimals[0])}</td>
                                                <td className="market-pair-orderbook-total">{balanceToUnitDisplay(swap['maker']['amount'], decimals[1])}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div id="market-pair-chart">
                            <div id="market-pair-chart-choser">
                                <button onClick={() => { setChartView('depth') }}>Depth Chart</button>
                                <button onClick={() => { setChartView('price') }}>Price Chart</button>
                            </div>

                            <div id="market-pair-chart-canvas"></div>
                        </div>

                        <div id="market-pair-history">
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
            </>}
        </div>
    </>)
}

export default MarketPair