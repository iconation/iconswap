import React, { useState } from 'react'
import { Redirect } from 'react-router-dom'
import './Overlay.css';

const Overlay = ({ content, redirect }) => {

    const [enableRedirection, setEnableRedirection] = useState(null)

    const overlay = document.getElementById("overlay");
    const closeButton = document.getElementsByClassName("close")[0];

    const onCloseOverlay = () => {
        if (redirect) {
            setEnableRedirection(redirect)
        } else {
            overlay.style.display = "none";
        }
    }

    if (closeButton) {
        closeButton.onclick = (event) => {
            onCloseOverlay();
        }
    }

    window.onclick = function (event) {
        if (event.target === overlay) {
            onCloseOverlay()
        }
    }

    return (
        <>
            {enableRedirection && <Redirect to={enableRedirection} />}
            <div id="overlay" className="overlay">
                <div className="overlayText" dangerouslySetInnerHTML={{ __html: '<span class="close">&times;</span>' + content }}>
                </div>
            </div>
        </>
    )
}

export default Overlay