import { api } from './API'
import { ICX_TOKEN_CONTRACT, ICX_TOKEN_DECIMALS } from './constants'

export const getTokenDetails = (contract) => {
    if (contract === ICX_TOKEN_CONTRACT) {
        return new Promise((resolve, reject) => {
            resolve({ name: 'ICX', symbol: 'ICX', contract: contract, decimals: ICX_TOKEN_DECIMALS })
        })
    }
    return api.tokenName(contract).then(name => {
        return api.tokenSymbol(contract).then(symbol => {
            return api.getDecimals(contract).then(decimals => {
                return { name: name, symbol: symbol, contract: contract, decimals: parseInt(decimals, 16) }
            })
        })
    })
}
