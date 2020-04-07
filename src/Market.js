import React, { useState } from 'react'
import { useHistory } from 'react-router-dom'
import LoadingOverlay from './LoadingOverlay'
import InfoBox from './InfoBox'
import { api } from './API'
import './Market.css'

const Market = ({ wallet }) => {

    const history = useHistory();

    const [marketInfo, setMarketInfo] = useState(null)

    !marketInfo && api.getMarketInfo().then(info => {
        setMarketInfo(info[0])
    })

    const onClickGoMarket = (pair) => {
        history.push("/market/" + pair)
    }

    return (
        <div id="market-choser-root">
            <div id="market-choser-container">
                <div className="market-choser-title">Select a Market</div>

                <div className="market-choser-table-view">
                    <table>
                        <thead>
                            <tr>
                                <th>Pair</th>
                                <th>Last Price</th>
                                <th>24h Change</th>
                                <th>Opened Swaps Count</th>
                                <th>Action</th>
                            </tr>
                        </thead>

                        <tbody>
                            {marketInfo && marketInfo['pairs'].map(pairs => (
                                <tr key={pairs}>
                                    <td>
                                        {marketInfo['tokens'][pairs['name'].split('/')[0]]['symbol']}
                                        /
                                        {marketInfo['tokens'][pairs['name'].split('/')[1]]['symbol']}
                                    </td>

                                    <td>{pairs['last_price']}</td>
                                    <td></td>
                                    <td>{parseInt(pairs['swaps_pending_count'], 16)}</td>
                                    <td>
                                        <button onClick={() => { onClickGoMarket(pairs['name']) }}>View</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>

                    </table>
                </div>
            </div>
        </div>
    )
}

export default Market