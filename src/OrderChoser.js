import React from 'react'
import './OrderChoser.css';
import Select from 'react-select';
import CustomInput from './CustomInput'

const OFFERING_INDEX = 0;
// const RECEIVING_INDEX = 1;

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

const OrderChoser = ({ whitelist, setContract, setAmount, titleText, index, orders }) => {
    const tokenId = "token" + index
    const contract = orders[index].contract

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
        setContract(index, contract)
    }

    let titleTextClassName = "bigtext order-choser-title"
    if (index === OFFERING_INDEX) {
        titleTextClassName += " order-choser-title-white"
    }

    return (
        <>
            {whitelist && <div id="order-choser-root">
                <div className={titleTextClassName}>{titleText}</div>

                <div className="order-choser-values">
                    <div className="order-choser-tokens">
                        <div className="order-choser-balance-select">
                            <Select
                                error={orders[index].contractError}
                                styles={customStyles}
                                name="form-field-name"
                                id={tokenId}
                                onChange={
                                    (option) => updateContract(index, option.value)
                                }
                                options={options}
                            />
                        </div>
                        {index === OFFERING_INDEX && contract &&
                            <input className="order-choser-balance" disabled
                                value={contract ?
                                    'Balance : '
                                    + whitelist[contract].balance + ' '
                                    + whitelist[contract].symbol : "Balance"} />
                        }
                    </div>

                    <br />

                    <CustomInput
                        error={orders[index].amountError}
                        label="Amount"
                        locked={false}
                        active={false}
                        numericOnly={true}
                        onChange={(value) => { setAmount(index, value) }}
                    />
                </div>
            </div>}
        </>
    )
}

export default OrderChoser