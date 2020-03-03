import React from 'react'
import './InfoBox.css';
import notice from './static/img/notice.png'
import success from './static/img/success.png'
import error from './static/img/error.png'

const InfoBox = ({ content, type }) => {

    if (!type) {
        type = "notice"
    }

    let imgobj = null;
    switch (type) {
        case "notice": imgobj = notice; break;
        case "success": imgobj = success; break;
        case "error": imgobj = error; break;
    }

    return (
        <div className={"alert-box " + type}><img alt={type} className="Img" src={imgobj} /><span>{type}:&nbsp;</span>
            <div className="alert-box-content" dangerouslySetInnerHTML={{ __html: content }} />
        </div>
    )
}

export default InfoBox