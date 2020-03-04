import React from 'react'
import './LoadingOverlay.css';

const LoadingOverlay = ({ over, text }) => {

    let overlayFinished = ''

    if (over) {
        overlayFinished = 'overlayFinished'
    }

    if (!text) {
        text = 'Loading...'
    }

    return (
        <>
            <div id="overlay" className={"overlay " + overlayFinished}>
                <div className="lds-text">{text}</div>
                <div className="lds-ripple"><div></div><div></div></div>
            </div>
        </>
    )
}

export default LoadingOverlay