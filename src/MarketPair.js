import React, { useState, useEffect, useRef } from 'react'
import LoadingOverlay from './LoadingOverlay'
import { api } from './API'
import './MarketPair.css'
import { useHistory } from 'react-router-dom';
import { IconConverter } from 'icon-sdk-js'
import { convertTsToDate } from './utils'
import * as am4core from "@amcharts/amcharts4/core";
import * as am4charts from "@amcharts/amcharts4/charts";
import am4themes_animated from "@amcharts/amcharts4/themes/animated";
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

    const pairName = pairs.join('/')

    const addDepthChart = (results) => {

        const [
            buyers, sellers,
            _,
            decimal1, decimal2,
            symbol1, symbol2,
            isInverted
        ] = results

        am4core.ready(function () {
            am4core.useTheme(am4themes_animated);
            let chart = am4core.create("market-pair-depth", am4charts.XYChart);

            const bids = buyers.map(buyer => {
                return [getPrice(buyer).toString(), parseFloat(balanceToUnitDisplay(buyer['taker']['amount'], decimal1))]
            })
            const asks = sellers.map(seller => {
                return [getPrice(seller).toString(), parseFloat(balanceToUnitDisplay(seller['maker']['amount'], decimal2))]
            })
            const data = !isInverted ?
                { "asks": asks, "bids": bids }
                : { "asks": bids, "bids": asks }

            // Add data
            const getData = (rawData) => {

                // Function to process (sort and calculate cummulative volume)
                function processData(list, type, desc) {

                    // Convert to data points
                    for (var i = 0; i < list.length; i++) {
                        list[i] = {
                            value: Number(list[i][0]),
                            volume: Number(list[i][1]),
                        }
                    }

                    // Sort list just in case
                    list.sort(function (a, b) {
                        if (a.value > b.value) {
                            return 1;
                        }
                        else if (a.value < b.value) {
                            return -1;
                        }
                        else {
                            return 0;
                        }
                    });

                    // Calculate cummulative volume
                    if (desc) {
                        for (var i = list.length - 1; i >= 0; i--) {
                            if (i < (list.length - 1)) {
                                list[i].totalvolume = list[i + 1].totalvolume + list[i].volume;
                            }
                            else {
                                list[i].totalvolume = list[i].volume;
                            }
                            var dp = {};
                            dp["value"] = list[i].value;
                            dp[type + "volume"] = list[i].volume;
                            dp[type + "totalvolume"] = list[i].totalvolume;
                            res.unshift(dp);
                        }
                    }
                    else {
                        for (var i = 0; i < list.length; i++) {
                            if (i > 0) {
                                list[i].totalvolume = list[i - 1].totalvolume + list[i].volume;
                            }
                            else {
                                list[i].totalvolume = list[i].volume;
                            }
                            var dp = {};
                            dp["value"] = list[i].value;
                            dp[type + "volume"] = list[i].volume;
                            dp[type + "totalvolume"] = list[i].totalvolume;
                            res.push(dp);
                        }
                    }

                }

                // Init
                var res = [];
                processData(rawData['bids'], "bids", true);
                processData(rawData['asks'], "asks", false);

                return res;
            };

            const formattedData = getData(data);
            chart.data = formattedData;

            // Set up precision for numbers
            chart.numberFormatter.numberFormat = "#,###.####";

            // Create axes
            var xAxis = chart.xAxes.push(new am4charts.CategoryAxis());
            xAxis.dataFields.category = "value";
            //xAxis.renderer.grid.template.location = 0;
            xAxis.renderer.minGridDistance = 50;
            xAxis.title.text = "Price (" + symbol1 + "/" + symbol2 + ")";

            var yAxis = chart.yAxes.push(new am4charts.ValueAxis());
            yAxis.title.text = "Volume";

            // Create series
            var series = chart.series.push(new am4charts.StepLineSeries());
            series.dataFields.categoryX = "value";
            series.dataFields.valueY = "bidstotalvolume";
            series.strokeWidth = 2;
            series.stroke = am4core.color("#0f0");
            series.fill = series.stroke;
            series.fillOpacity = 0.1;
            series.tooltipText = "Ask: [bold]{categoryX}[/]\nTotal volume: [bold]{valueY}[/]\nVolume: [bold]{bidsvolume}[/]"

            var series2 = chart.series.push(new am4charts.StepLineSeries());
            series2.dataFields.categoryX = "value";
            series2.dataFields.valueY = "askstotalvolume";
            series2.strokeWidth = 2;
            series2.stroke = am4core.color("#f00");
            series2.fill = series2.stroke;
            series2.fillOpacity = 0.1;
            series2.tooltipText = "Bids: [bold]{categoryX}[/]\nTotal volume: [bold]{valueY}[/]\nVolume: [bold]{asksvolume}[/]"

            var series3 = chart.series.push(new am4charts.ColumnSeries());
            series3.dataFields.categoryX = "value";
            series3.dataFields.valueY = "bidsvolume";
            series3.strokeWidth = 0;
            series3.fill = am4core.color("#000");
            series3.fillOpacity = 0.2;

            var series4 = chart.series.push(new am4charts.ColumnSeries());
            series4.dataFields.categoryX = "value";
            series4.dataFields.valueY = "asksvolume";
            series4.strokeWidth = 0;
            series4.fill = am4core.color("#000");
            series4.fillOpacity = 0.2;

            // Add cursor
            chart.cursor = new am4charts.XYCursor();
        })
    }

    const refreshData = () => {

        let promises = [
            api.getMarketBuyersPendingSwaps(pairName),
            api.getMarketSellerPendingSwaps(pairName),
            api.getMarketFilledSwaps(pairName, 0),
            api.getDecimals(pairs[0]),
            api.getDecimals(pairs[1]),
            api.tokenSymbol(pairs[0]),
            api.tokenSymbol(pairs[1]),
        ]

        return Promise.all(promises).then(results => {
            const [
                buyers, sellers,
                filledSwaps,
                decimal1, decimal2,
                symbol1, symbol2
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

            setSwapsFilled(filledSwaps)
            setDecimals([decimal1, decimal2])
            let symbols = {}
            symbols[pairs[0]] = symbol1
            symbols[pairs[1]] = symbol2
            setSymbols(symbols)
            scrollSellersToBottom()
            addDepthChart(results)
        })
    }

    useEffect(() => {
        refreshData()
    }, [pairs]);

    const scrollSellersToBottom = () => {
        const div = scrollSellers.current;
        if (div) {
            div.scrollTop = div.scrollHeight;
        }
    }

    const isBuyer = (swap) => {
        return swap['maker']['contract'] === pairs[1]
    }

    const getPriceBigNumber = (swap) => {

        const [o1, o2] = isBuyer(swap) ?
            [swap['maker'], swap['taker']]
            : [swap['taker'], swap['maker']]

        return IconConverter.toBigNumber(o1['amount'])
            .dividedBy(IconConverter.toBigNumber(o2['amount']))
    }

    const displayBigNumber = (f) => {
        return parseFloat(f.toFixed(8)).toString()
    }

    const getPrice = (swap) => {
        return displayBigNumber(getPriceBigNumber(swap))
    }

    const balanceToUnit = (balance, decimals) => {
        const digits = IconConverter.toBigNumber('10').exponentiatedBy(decimals)
        return IconConverter.toBigNumber(balance).dividedBy(digits)
    }

    const balanceToUnitDisplay = (balance, decimals) => {
        return displayBigNumber(balanceToUnit(balance, decimals))
    }

    const goToSwap = (swap) => {
        window.open("#/swap/" + parseInt(swap['id'], 16), '_blank')
    }

    const getSpread = (swapBid, swapAsk) => {
        if (!swapBid | !swapAsk) return 0;

        const bid = getPriceBigNumber(swapBid)
        const ask = getPriceBigNumber(swapAsk)
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
                                                    <strong>*</strong> <span className="tooltiptext">You created this swap</span>
                                                </>}
                                                </td>
                                                <td className="market-pair-orderbook-price market-pair-sellers-text" >{getPrice(swap)}</td>
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
                                <div id="market-pair-spread">Spread: <br /> {getSpread(sellers.slice(-1)[0], buyers[0])} %</div>
                                <div id="market-pair-lastprice">Last Price : <br /> {(swapsFilled.length > 0 && getPrice(swapsFilled[0])) || 0}</div>
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
                                                    <strong>*</strong> <span className="tooltiptext tooltiptext-bottom">You created this swap</span>
                                                </>}
                                                </td>
                                                <td className="market-pair-orderbook-price market-pair-buyers-text" >{getPrice(swap)}</td>
                                                <td className="market-pair-orderbook-amount">{balanceToUnitDisplay(swap['taker']['amount'], decimals[0])}</td>
                                                <td className="market-pair-orderbook-total">{balanceToUnitDisplay(swap['maker']['amount'], decimals[1])}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div id="market-pair-depth"></div>

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
                                            {isBuyer(swap) && <>
                                                <td className="market-pair-history-price market-pair-buyers-text" >{getPrice(swap)}</td>
                                                <td className="market-pair-history-amount">{balanceToUnitDisplay(swap['taker']['amount'], decimals[0])}</td>
                                                <td className="market-pair-history-total">{balanceToUnitDisplay(swap['maker']['amount'], decimals[1])}</td>
                                                <td className="market-pair-history-filled">{convertTsToDate(swap['timestamp_swap'])}</td>
                                            </>}
                                            {!isBuyer(swap) && <>
                                                <td className="market-pair-history-price market-pair-sellers-text" >{getPrice(swap)}</td>
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