
import { IconConverter } from 'icon-sdk-js'

export const convertTsToDate = (timestamp) => {
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

export const convertTsToNumericDate = (timestamp) => {
    function pad(n) { return n < 10 ? '0' + n : n }

    var a = new Date(parseInt(timestamp, 16) / 1000);
    var year = a.getFullYear();
    var month = pad(a.getMonth() + 1);
    var date = pad(a.getDate());
    var time = year + '-' + month + '-' + date;
    return time;
}

export const redirectClick = (event, history, dest) => {
    // dest for example : "/market"

    // external : open in new window always
    if (dest.startsWith("http")) {
        window.open(dest, '_blank');
    }

    else {
        if ((event.button === 1) || (event.ctrlKey && event.button === 0)) {
            window.open("#" + dest, '_blank');
        }
        else if (event.button === 0) {
            history.push(dest);
        }
    }
}

export const displayBigNumber = (f) => {
    return parseFloat(f.toFixed(8)).toString()
}

export const displayFloat = (f) => {
    return parseFloat(f.toFixed(8)).toString()
}

export const balanceToUnit = (balance, decimals) => {
    const digits = IconConverter.toBigNumber('10').exponentiatedBy(decimals)
    return IconConverter.toBigNumber(balance).dividedBy(digits)
}

export const balanceToUnitDisplay = (balance, decimals) => {
    return displayBigNumber(balanceToUnit(balance, decimals))
}

export const isBuyer = (swap, pairs) => {
    return swap['maker']['contract'] === pairs[1]
}

export const getPriceBigNumber = (swap, pairs) => {

    const [o1, o2] = isBuyer(swap, pairs) ?
        [swap['maker'], swap['taker']]
        : [swap['taker'], swap['maker']]

    return IconConverter.toBigNumber(o1['amount'])
        .dividedBy(IconConverter.toBigNumber(o2['amount']))
}

export const getPrice = (swap, pairs) => {
    return displayBigNumber(getPriceBigNumber(swap, pairs))
}

export const truncateDecimals = (number, digits) => {
    var multiplier = Math.pow(10, digits),
        adjustedNum = number * multiplier,
        truncatedNum = Math[adjustedNum < 0 ? 'ceil' : 'floor'](adjustedNum);

    return truncatedNum / multiplier;
};
