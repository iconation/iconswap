import React from 'react'
import './InfoBox.css';
import notice from './static/img/notice.png'

const InfoBox = ({ content }) => {
    return (
        <div className="alert-box notice"><img alt="notice" className="noticeImg" src={notice} /><span>notice:&nbsp;</span>
            <div className="alert-box-content" dangerouslySetInnerHTML={{ __html: content }} />
        </div>
    )
}

export default InfoBox