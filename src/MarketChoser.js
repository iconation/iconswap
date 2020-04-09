import React, { useState } from 'react'
import { useHistory } from 'react-router-dom'
import LoadingOverlay from './LoadingOverlay'
import { api } from './API'
import './MarketChoser.css'
import Select from 'react-select';

const colors = {
    divider: 'rgba(0,0,0,0)',
    error: '#ec392f'
};

export const customStyles = {
    control: (base, state) => {
        let statusColor = colors.divider;

        if (state.selectProps.error) {
            statusColor = colors.error;
        }

        return {
            ...base,
            boxShadow: `0 0 0 2px ${statusColor}`,
            transition: " 0.25s linear",
            transitionProperty: "box-shadow",
        };
    },
};

const Market = ({ wallet }) => {

    const history = useHistory();

    const [marketInfo, setMarketInfo] = useState(null)

    !marketInfo && api.getMarketInfo().then(info => {
        setMarketInfo(info[0])
    })

    const redirectToMarket = (pair) => {
        history.push("/market/" + pair)
    }

    const loadingText = 'Loading Marketplace...'
    const over = (marketInfo !== null)

    const options = marketInfo && marketInfo['pairs'].map(pairs => {
        return {
            'value': pairs['name'],
            'label': marketInfo['tokens'][pairs['name'].split('/')[0]]['symbol'] + "/" +
                marketInfo['tokens'][pairs['name'].split('/')[1]]['symbol']
        }
    })

    return (<>

        <LoadingOverlay over={over} text={loadingText} />

        <div id="market-choser-root">
            <div id="market-choser-container">
                <div className="market-choser-title">Select a Market</div>

                <div id="market-choser-select-view">
                    <Select
                        styles={customStyles}
                        name="form-field-name"
                        id={'market-choser-select'}
                        onChange={(option) => redirectToMarket(option.value)}
                        options={options}
                    />
                </div>

                <div className="market-choser-table-view">
                    <table className="market-choser-table">
                        <thead>
                            <tr>
                                <th>Pair</th>
                                <th>Last Price</th>
                                <th>24h Change</th>
                                <th>Opened Swaps Count</th>
                            </tr>
                        </thead>

                        <tbody>
                            {marketInfo && marketInfo['pairs'].map(pairs => (
                                <tr className="market-choser-tr-clickeable"
                                    onClick={() => { redirectToMarket(pairs['name']) }}
                                    key={pairs['name']}>
                                    <td className="market-choser-symbol market-choser-td">
                                        {marketInfo['tokens'][pairs['name'].split('/')[0]]['symbol']}
                                        /
                                        {marketInfo['tokens'][pairs['name'].split('/')[1]]['symbol']}
                                    </td>

                                    <td className="market-choser-lastprice market-choser-td">{pairs['last_price']}</td>
                                    <td className="market-choser-change24 market-choser-td">-</td>
                                    <td className="market-choser-opened market-choser-td">{parseInt(pairs['swaps_pending_count'], 16)}</td>
                                </tr>
                            ))}
                        </tbody>

                    </table>
                </div>
            </div>
        </div>
    </>)
}

export default Market