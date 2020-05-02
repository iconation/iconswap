import React from 'react'
import './Footer.css'
import iconation from './static/img/iconation.png'
import { redirectClick } from './utils'
import { useHistory } from 'react-router-dom'

const Footer = () => {

    const history = useHistory();

    const onClick = (event) => {
        redirectClick(event, history, "https://iconation.team")
    }

    return (
        <div id="footer">
            <div onMouseDown={(event) => { onClick(event) }} className="footer-iconation-item"><img src={iconation} height="30px" alt="iconation"></img></div>
            <div onMouseDown={(event) => { onClick(event) }} className="footer-iconation-item">ICONation</div>
        </div>
    )
}

export default Footer