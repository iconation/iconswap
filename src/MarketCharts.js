
import { convertTsToNumericDate, balanceToUnitDisplay, getPrice } from './utils'
import * as am4core from "@amcharts/amcharts4/core";
import * as am4charts from "@amcharts/amcharts4/charts";
import am4themes_animated from "@amcharts/amcharts4/themes/animated";

var curChart = null;

export const showDepthChart = (market, pairs, isInverted) => {
    if (!market) return;
    if (curChart) curChart.dispose();

    const [
        , ,
        buyers, sellers,
        decimal1, decimal2,
        symbol1, symbol2
    ] = market

    am4core.ready(function () {
        am4core.useTheme(am4themes_animated);
        let chart = am4core.create("market-pair-chart-canvas", am4charts.XYChart);
        curChart = chart;

        const bids = buyers.map(buyer => {
            return [getPrice(buyer, pairs).toString(), parseFloat(balanceToUnitDisplay(buyer['taker']['amount'], decimal1))]
        })
        const asks = sellers.map(seller => {
            return [getPrice(seller, pairs).toString(), parseFloat(balanceToUnitDisplay(seller['maker']['amount'], decimal2))]
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

export const showPriceChart = (market, pairs, isInverted) => {
    if (!market) return;
    if (curChart) curChart.dispose();

    const [
        , ,
        , ,
        decimal1, ,
        , ,
        history,

    ] = market

    am4core.ready(function () {
        am4core.useTheme(am4themes_animated);
        let chart = am4core.create("market-pair-chart-canvas", am4charts.XYChart);
        curChart = chart;

        const getFormattedData = (history) => {
            var prices = []
            var lastDate = null;
            var lastHigh = 0;
            var lastLow = 0;
            var lastOpen = 0;
            var lastClose = 0;
            var lastVolume = 0;

            for (const [key, swap] of Object.entries(history)) {
                const curPrice = getPrice(swap, pairs)

                // init
                if (parseInt(key) === 0) {
                    lastDate = convertTsToNumericDate(swap['timestamp_swap'])
                    lastHigh = curPrice;
                    lastLow = curPrice;
                    lastOpen = curPrice;
                    lastClose = curPrice;
                }

                const curDate = convertTsToNumericDate(swap['timestamp_swap'])
                if (lastDate !== curDate) {
                    // New day, push the previous one
                    prices.push({
                        "Date": lastDate,
                        "Open": lastOpen,
                        "High": lastHigh,
                        "Low": lastLow,
                        "Close": lastClose,
                        "Volume": lastVolume
                    })
                    lastDate = curDate;
                    lastHigh = curPrice;
                    lastLow = curPrice;
                    lastOpen = curPrice;
                    lastClose = curPrice;
                    if (swap.maker.contract === pairs[0]) {
                        lastVolume = parseFloat(balanceToUnitDisplay(swap['maker']['amount'], decimal1))
                    } else {
                        lastVolume = parseFloat(balanceToUnitDisplay(swap['taker']['amount'], decimal1))
                    }
                }
                else {
                    if (curPrice > lastHigh) {
                        lastHigh = curPrice
                    }
                    if (curPrice < lastLow) {
                        lastLow = curPrice
                    }

                    if (swap.maker.contract === pairs[0]) {
                        lastVolume += parseFloat(balanceToUnitDisplay(swap['maker']['amount'], decimal1))
                    } else {
                        lastVolume += parseFloat(balanceToUnitDisplay(swap['taker']['amount'], decimal1))
                    }

                    lastClose = curPrice;
                }
            }

            // Push the last day
            prices.push({
                "Date": lastDate,
                "Open": lastOpen,
                "High": lastHigh,
                "Low": lastLow,
                "Close": lastClose,
                "Volume": lastVolume
            })

            return prices
        }

        chart.data = getFormattedData(history.slice().reverse());

        // the following line makes value axes to be arranged vertically.
        chart.leftAxesContainer.layout = "vertical";

        // uncomment this line if you want to change order of axes
        //chart.bottomAxesContainer.reverseOrder = true;

        var dateAxis = chart.xAxes.push(new am4charts.DateAxis());
        dateAxis.renderer.grid.template.location = 0;
        dateAxis.renderer.ticks.template.length = 8;
        dateAxis.renderer.ticks.template.strokeOpacity = 0.1;
        dateAxis.renderer.grid.template.disabled = true;
        dateAxis.renderer.ticks.template.disabled = false;
        dateAxis.renderer.minLabelPosition = 0.01;
        dateAxis.renderer.maxLabelPosition = 0.99;

        dateAxis.groupData = true;

        // these two lines makes the axis to be initially zoomed-in
        // dateAxis.start = 0.1;
        // dateAxis.keepSelection = true;

        var valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
        valueAxis.tooltip.disabled = true;
        valueAxis.zIndex = 1;
        valueAxis.renderer.baseGrid.disabled = true;
        // height of axis
        valueAxis.height = am4core.percent(60);

        valueAxis.renderer.gridContainer.background.fill = am4core.color("#000000");
        valueAxis.renderer.gridContainer.background.fillOpacity = 0.05;
        valueAxis.renderer.inside = true;
        valueAxis.renderer.labels.template.verticalCenter = "bottom";
        valueAxis.renderer.labels.template.padding(2, 2, 2, 2);
        //valueAxis.renderer.maxLabelPosition = 0.95;
        valueAxis.renderer.fontSize = "0.8em"
        valueAxis.logarithmic = true;

        var series = chart.series.push(new am4charts.CandlestickSeries());
        series.dataFields.dateX = "Date";
        series.dataFields.openValueY = "Open";
        series.dataFields.valueY = "Close";
        series.dataFields.lowValueY = "Low";
        series.dataFields.highValueY = "High";
        series.clustered = false;
        series.tooltipText = "open: {openValueY.value}\nlow: {lowValueY.value}\nhigh: {highValueY.value}\nclose: {valueY.value}";
        series.name = "MSFT";
        series.defaultState.transitionDuration = 0;

        var valueAxis2 = chart.yAxes.push(new am4charts.ValueAxis());
        valueAxis2.tooltip.disabled = true;
        // height of axis
        valueAxis2.height = am4core.percent(15);
        valueAxis2.zIndex = 3
        // this makes gap between panels
        valueAxis2.marginTop = 0;
        valueAxis2.renderer.baseGrid.disabled = true;
        valueAxis2.renderer.inside = true;
        valueAxis2.renderer.labels.template.verticalCenter = "bottom";
        valueAxis2.renderer.labels.template.padding(0, 0, -30, 0);
        //valueAxis.renderer.maxLabelPosition = 0.95;
        valueAxis2.renderer.fontSize = "0.8em"

        valueAxis2.renderer.gridContainer.background.fill = am4core.color("#000000");
        valueAxis2.renderer.gridContainer.background.fillOpacity = 0.05;

        var series2 = chart.series.push(new am4charts.ColumnSeries());
        series2.dataFields.dateX = "Date";
        series2.clustered = false;
        series2.dataFields.valueY = "Volume";
        series2.yAxis = valueAxis2;
        series2.tooltipText = "{valueY.value}";
        series2.name = "Series 2";
        // volume should be summed
        series2.groupFields.valueY = "sum";
        series2.defaultState.transitionDuration = 0;
        chart.cursor = new am4charts.XYCursor();

        var sbSeries = chart.series.push(new am4charts.LineSeries());
        sbSeries.dataFields.valueY = "Close";
        sbSeries.dataFields.dateX = "Date";
    })
}
