import React from 'react'
import './Footer.css'
import iconation from './static/img/iconation.png'

const Footer = () => {

    return (
        <div id="footer">
            <div id="footer-text">
                <div id="footer-text-container">
                    <div className="iconation-footer-item"><a href="https://iconation.team"><img src={iconation} height="30px" alt="iconation"></img></a></div>
                    <div className="iconation-footer-item">© 2020 ICONation</div>
                </div>
            </div>
        </div>
    )
}

export default Footer