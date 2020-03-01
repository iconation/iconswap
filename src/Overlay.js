import React from 'react'
import './Overlay.css';
import { useHistory } from 'react-router-dom';

const Overlay = ({ content, redirect }) => {

    const overlay = document.getElementById("overlay");
    const closeButton = document.getElementsByClassName("close")[0];
    const history = useHistory();


    const onCloseOverlay = () => {
        if (redirect) {
            history.push(redirect)
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
        <div id="overlay" className="overlay">
            <div className="overlayText" dangerouslySetInnerHTML={{ __html: '<span class="close">&times;</span>' + content }}>
            </div>
        </div>
    )
}

export default Overlay