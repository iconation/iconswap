
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