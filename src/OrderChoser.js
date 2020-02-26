import React, { useState } from 'react'
import './OrderChoser.css';
import { IconConverter } from 'icon-sdk-js'
import { api } from './API'
import { ICX_TOKEN_CONTRACT } from './constants'
import Select from 'react-select';
import CustomInput from './CustomInput'

const OFFERING_INDEX = 0;
const RECEIVING_INDEX = 1;

const OrderChoser = ({ whitelist, setContractOnChange, setAmountOnChange, titleText, index }) => {
    const tokenId = "token" + index
    const amountId = "amount" + index
    const [contract, setContract] = useState(null)

    if (whitelist && index === OFFERING_INDEX) {
        whitelist = Object.keys(whitelist).reduce(function (filtered, key) {
            if (whitelist[key].balance > 0) filtered[key] = whitelist[key];
            return filtered;
        }, {});
    }

    const options = whitelist && Object.keys(whitelist).map(key => {
        return {
            'value': whitelist[key].contract,
            'label': whitelist[key].name + ' (' + whitelist[key].symbol + ')'
        }
    })

    const updateContract = (index, contract) => {
        setContract(contract)
        setContractOnChange(index, contract)
    }

    return (
        <>
            {whitelist && <div id="OrderChoserRoot">
                <div className="ChoserTitle">{titleText}</div>

                <div className="ChoserValues">

                    <div className="TokenChosers">
                        <div className="balanceSelect">
                            <Select
                                name="form-field-name"
                                id={tokenId}
                                onChange={
                                    (option) => updateContract(index, option.value)
                                }
                                options={options}
                            />
                        </div>
                        {index === OFFERING_INDEX && contract && <input className="balanceInput" disabled
                            value={contract ? 'Balance : ' + whitelist[contract].balance + ' ' + whitelist[contract].symbol : "Balance"} />
                        }
                    </div>

                    <br />

                    <CustomInput
                        id={2}
                        label="Amount"
                        locked={false}
                        active={false}
                        numericOnly={true}
                        onChange={(value) => { setAmountOnChange(index, value) }}
                    />
                </div>
            </div>}
        </>
    )
}

export default OrderChoser