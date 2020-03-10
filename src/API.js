import IconService, { IconConverter } from 'icon-sdk-js'
import { SCORE_NETWORK, SCORE_ENDPOINT, Networks, ICX_TOKEN_CONTRACT, ICX_TOKEN_DECIMALS, MAX_ITERATION_LOOP } from './constants'

// ================================================
//  Constants
// ================================================
const SwapCreatedEvent = 'SwapCreatedEvent(int,int,int)'
/*
const SwapSuccessEvent = 'SwapSuccessEvent(int)'
const SwapCancelledEvent = 'SwapCancelledEvent(int)'
const OrderFilledEvent = 'OrderFilledEvent(int)'
const OrderTransferedEvent = 'OrderTransferedEvent(int,Address,int,Address)'
const OrderRefundedEvent = 'OrderRefundedEvent(int)'
*/

// ================================================
//  Exceptions
// ================================================
export class SCOREUnhandledError extends Error {
    constructor(error, txHash) {
        super(error, txHash)
        this.name = 'SCOREUnhandledError'
        this.txHash = txHash
        this.error = error
    }

    toString() {
        console.log(this.error)
        return 'Internal Error, please report this transaction hash on Telegram (https://t.me/iconationteam) : ' + this.txHash + ' - Thank you!'
    }
}

export class UnconfirmedTransaction extends Error {
    constructor(txHash) {
        super(txHash)
        this.name = 'UnconfirmedTransaction'
    }

    toString() {
        return 'The transaction cannot be confirmed.'
    }
}

export class WrongEventSignature extends Error {
    constructor(txHash) {
        super(txHash)
        this.name = 'WrongEventSignature'
    }

    toString() {
        return 'The event received was not expected.'
    }
}

// ================================================
//  API Implementation
// ================================================
class API {
    constructor(network, scoreAddress) {
        const iconNetworkInfo = this._getNetworkInfo(network)

        const api = iconNetworkInfo.api
        const httpProvider = new IconService.HttpProvider(api + '/api/v3')
        const httpDebugProvider = new IconService.HttpProvider(api + '/api/debug/v3')

        this._nid = iconNetworkInfo.nid
        this._network = network
        this._iconService = new IconService(httpProvider)
        this._iconDebugService = new IconService(httpDebugProvider)
        this._scoreAddress = scoreAddress
    }

    _getNetworkInfo(network) {
        const iconNetworksInfo = []
        iconNetworksInfo[Networks.LOCALHOST] = {
            name: 'localhost',
            api: 'http://127.0.0.1:9000',
            tracker: 'http://127.0.0.1:9000',
            nid: 0
        }
        iconNetworksInfo[Networks.MAINNET] = {
            name: 'MainNet',
            api: 'https://ctz.solidwallet.io',
            tracker: 'https://tracker.icon.foundation',
            nid: 1
        }
        iconNetworksInfo[Networks.EULJIRO] = {
            name: 'Euljiro (TestNet)',
            api: 'https://test-ctz.solidwallet.io',
            tracker: 'https://trackerdev.icon.foundation',
            nid: 2
        }
        iconNetworksInfo[Networks.YEOUIDO] = {
            name: 'Yeouido (TestNet)',
            api: 'https://bicon.net.solidwallet.io',
            tracker: 'https://bicon.tracker.solidwallet.io',
            nid: 3
        }
        return iconNetworksInfo[network]
    }

    getAPIEndpoint() {
        return this._getNetworkInfo(this._network).api
    }

    getTrackerEndpoint() {
        return this._getNetworkInfo(this._network).tracker
    }

    getNetworkName() {
        return this._getNetworkInfo(this._network).name
    }

    getWhitelist() {
        return this.__call(this._scoreAddress, 'get_whitelist').then(whitelist => {
            return whitelist
        })
    }

    getSwap(swapId) {
        return this.__call(this._scoreAddress, 'get_swap', { swap_id: IconConverter.toHex(swapId) }).then(swap => {
            return swap
        })
    }

    getOrder(orderId) {
        return this.__call(this._scoreAddress, 'get_order', { order_id: IconConverter.toHex(orderId) }).then(swap => {
            return swap
        })
    }

    getTokenDetails(wallet, contract) {
        return api.__getBalance(wallet, contract).then(balance => {
            if (contract === ICX_TOKEN_CONTRACT) {
                return new Promise((resolve, reject) => {
                    resolve({
                        name: 'ICX',
                        symbol: 'ICX',
                        contract: contract,
                        decimals: ICX_TOKEN_DECIMALS,
                        balance: balance
                    })
                })
            }
            return api.tokenName(contract).then(name => {
                return api.tokenSymbol(contract).then(symbol => {
                    return api.getDecimals(contract).then(decimals => {
                        return {
                            name: name,
                            symbol: symbol,
                            contract: contract,
                            decimals: parseInt(decimals, 16),
                            balance: balance
                        }
                    })
                })
            })
        })
    }


    getDecimals(contract) {
        if (contract === ICX_TOKEN_CONTRACT) {
            return new Promise((resolve, reject) => {
                resolve(ICX_TOKEN_DECIMALS)
            })
        }
        return this.__call(contract, 'decimals').then(decimals => {
            return decimals
        })
    }

    async __callWithOffset(contract, method, params) {
        let result = {}
        let offset = 0

        while (true) {
            params['offset'] = IconConverter.toHex(offset)
            const orders = await this.__call(contract, method, params)

            offset += MAX_ITERATION_LOOP
            if (Object.keys(orders).length === 0) {
                break
            }

            result = Object.assign({}, result, orders)
        }

        return result
    }

    getPendingOrdersByAddress(walletAddress) {
        return this.__callWithOffset(this._scoreAddress, 'get_pending_orders_by_address', { address: walletAddress })
            .then(orders => {
                return orders
            })
    }

    getFilledOrdersByAddress(walletAddress) {
        return this.__callWithOffset(this._scoreAddress, 'get_filled_orders_by_address', { address: walletAddress })
            .then(orders => {
                return orders
            })
    }

    fillOrder(walletAddress, swapId, taker_contract, taker_amount) {
        swapId = IconConverter.toHex(IconConverter.toBigNumber(swapId))
        if (taker_contract === ICX_TOKEN_CONTRACT) {
            const value = IconConverter.toHex(taker_amount)
            return this.__iconexCallTransaction(
                walletAddress,
                this._scoreAddress,
                'fill_icx_order',
                value, { swap_id: swapId }
            ).then(tx => {
                return tx
            })
        } else {
            const value = IconConverter.toHex(taker_amount)
            const data = {
                'action': 'fill_irc2_order',
                'swap_id': swapId
            }
            const params = {
                '_to': this._scoreAddress,
                '_value': value,
                '_data': IconConverter.toHex(JSON.stringify(data))
            }
            return this.__iconexCallTransaction(
                walletAddress,
                taker_contract,
                'transfer',
                0,
                params
            ).then(tx => {
                return tx
            })
        }
    }

    cancelSwap(walletAddress, swapId) {
        return this.__iconexCallTransaction(walletAddress, this._scoreAddress, 'cancel_swap', 0, { swap_id: swapId }).then(txHash => {
            return txHash
        })
    }

    createSwap(walletAddress, maker_contract, maker_amount, taker_contract, taker_amount) {
        const getSwapIdFromTx = async (tx) => {
            if (!tx) return null;
            const txHash = tx['result']
            const txResult = await this.__txResult(txHash)
            const eventLogs = txResult['eventLogs'][0]
            if (eventLogs['indexed'][0] !== SwapCreatedEvent) {
                throw WrongEventSignature(eventLogs['indexed']);
            }
            const swapId = parseInt(eventLogs['indexed'][1], 16)
            const maker = parseInt(eventLogs['data'][0], 16)
            const taker = parseInt(eventLogs['data'][1], 16)
            return { swapId: swapId, maker: maker, taker: taker }
        }

        if (maker_contract === ICX_TOKEN_CONTRACT) {
            const params = {
                taker_contract: taker_contract,
                taker_amount: IconConverter.toHex(IconConverter.toBigNumber(taker_amount)),
            }
            return this.__iconexCallTransaction(walletAddress, this._scoreAddress, 'create_icx_swap', maker_amount, params)
                .then(async tx => {
                    return getSwapIdFromTx(tx)
                })
        } else {
            const value = IconConverter.toHex(maker_amount)
            const data = {
                'action': 'create_irc2_swap',
                'taker_contract': taker_contract,
                'taker_amount': IconConverter.toHex(IconConverter.toBigNumber(taker_amount)),
            }
            const params = {
                '_to': this._scoreAddress,
                '_value': value,
                '_data': IconConverter.toHex(JSON.stringify(data))
            }
            return this.__iconexCallTransaction(walletAddress, maker_contract, 'transfer', 0, params).then(async tx => {
                return getSwapIdFromTx(tx)
            })
        }
    }

    balanceToFloat(balance, contract) {
        return this.getDecimals(contract).then(decimals => {
            const digits = IconConverter.toBigNumber('10').exponentiatedBy(decimals)
            return IconConverter.toBigNumber(balance).dividedBy(digits).toString()
        })
    }

    // IRC2 Token Interface ============================================================
    tokenName(contract) {
        return this.__call(contract, 'name').then(name => {
            return name
        })
    }
    tokenSymbol(contract) {
        return this.__call(contract, 'symbol').then(symbol => {
            return symbol
        })
    }

    // ICONex Connect Extension =============================================================
    iconexHasAccount() {
        return this.__iconexConnectRequest('REQUEST_HAS_ACCOUNT').then(payload => {
            return payload
        })
    }

    iconexHasAddress(address) {
        return this.__iconexConnectRequest('REQUEST_HAS_ADDRESS', address).then(payload => {
            return payload
        })
    }

    iconexAskAddress() {
        return this.__iconexConnectRequest('REQUEST_ADDRESS').then(payload => {
            return payload
        })
    }

    // ======================================================================================
    // Following classes are private because they are lower level methods at a protocol level
    __iconexCallTransactionEx(from, to, method, value, stepLimit, params) {
        const transaction = this.__icxCallTransactionBuild(from, to, method, value, stepLimit, params)
        const jsonRpcQuery = {
            jsonrpc: '2.0',
            method: 'icx_sendTransaction',
            params: IconConverter.toRawTransaction(transaction),
            id: 1234
        }
        return this.__iconexJsonRpc(jsonRpcQuery)
    }

    __iconexCallTransaction(from, to, method, value, params) {
        return this.__estimateCallStep(from, to, method, value, params).then(stepLimit => {
            return this.__iconexCallTransactionEx(from, to, method, value, stepLimit, params)
        })
    }

    __iconexConnectRequest(requestType, payload) {
        return new Promise((resolve, reject) => {
            function eventHandler(event) {
                const { payload } = event.detail
                window.removeEventListener('ICONEX_RELAY_RESPONSE', eventHandler)
                resolve(payload)
            }
            window.addEventListener('ICONEX_RELAY_RESPONSE', eventHandler)

            window.dispatchEvent(new window.CustomEvent('ICONEX_RELAY_REQUEST', {
                detail: {
                    type: requestType,
                    payload
                }
            }))
        })
    }

    __iconexIcxTransaction(from, to, value) {
        const transaction = this.__icxTransactionBuild(from, to, value, 100000)
        const jsonRpcQuery = {
            jsonrpc: '2.0',
            method: 'icx_sendTransaction',
            params: IconConverter.toRawTransaction(transaction),
            id: 1234
        }
        return this.__iconexJsonRpc(jsonRpcQuery)
    }

    __iconexJsonRpc(jsonRpcQuery) {
        return this.__iconexConnectRequest('REQUEST_JSON-RPC', jsonRpcQuery).then(payload => {
            return payload
        })
    }

    // ======================================================================================
    __getIcxBalance(address) {
        const digits = IconConverter.toBigNumber('10').exponentiatedBy(18)
        return this._iconService.getBalance(address).execute().then(balance => {
            return balance / digits;
        })
    }

    __getIRC2Balance(address, contract) {
        return this.__call(contract, 'balanceOf', { '_owner': address }).then(balance => {
            return this.getDecimals(contract).then(decimals => {
                const digits = IconConverter.toBigNumber('10').exponentiatedBy(decimals)
                return balance / digits
            })
        })
    }


    __getBalance(address, contract) {
        if (contract === ICX_TOKEN_CONTRACT) {
            return this.__getIcxBalance(address)
        } else {
            return this.__getIRC2Balance(address, contract)
        }
    }

    __call(to, method, params = {}) {
        return new Promise((resolve, reject) => {
            try {
                let callBuilder = new IconService.IconBuilder.CallBuilder()
                    .from(null)
                    .to(to)
                    .method(method)

                // Optional "params" field
                if (Object.keys(params).length !== 0) {
                    callBuilder = callBuilder.params(params)
                }

                const call = callBuilder.build()
                const result = this._iconService.call(call).execute()
                resolve(result)
            } catch (err) {
                reject(err)
            }
        })
    }

    __callTx(to, method, wallet, stepLimit, value = 0, params = {}) {
        return new Promise((resolve, reject) => {
            try {
                let callTransactionBuilder = new IconService.IconBuilder.CallTransactionBuilder()
                    .from(wallet.getAddress())
                    .to(to)
                    .value(IconConverter.toHex(IconService.IconAmount.of(value, IconService.IconAmount.Unit.ICX).toLoop()))
                    .stepLimit(IconConverter.toBigNumber(stepLimit)) // 40000000
                    .nid(IconConverter.toBigNumber(this._nid))
                    .nonce(IconConverter.toBigNumber(1))
                    .version(IconConverter.toBigNumber(3))
                    .timestamp((new Date()).getTime() * 1000)
                    .method(method)

                // Optional "params" field
                if (Object.keys(params).length !== 0) {
                    callTransactionBuilder = callTransactionBuilder.params(params)
                }

                const transaction = new IconService.SignedTransaction(callTransactionBuilder.build(), wallet)
                const result = this._iconService.sendTransaction(transaction).execute()
                resolve(result)
            } catch (err) {
                reject(err)
            }
        })
    }

    __estimateCallStep(from, to, method, value, params = {}) {
        const transaction = {
            "jsonrpc": "2.0",
            "method": "debug_estimateStep",
            "id": 1,
            "params": {
                "version": "0x3",
                "from": from,
                "to": to,
                "value": IconConverter.toHex(IconConverter.toBigNumber(value)),
                "timestamp": IconConverter.toHex((new Date()).getTime() * 1000),
                "nid": IconConverter.toHex(IconConverter.toBigNumber(this._nid)),
                "nonce": "0x1",
                "dataType": "call",
                "data": {
                    "method": method,
                    "params": params
                }
            }
        }

        return new Promise((resolve, reject) => {
            try {
                const result = this._iconDebugService.provider.request(transaction).execute()
                resolve(result)
            } catch (err) {
                reject(err)
            }
        })
    }

    __icxCallTransactionBuild(from, to, method, value, stepLimit, params = {}) {
        let callTransactionBuilder = new IconService.IconBuilder.CallTransactionBuilder()
            .from(from)
            .to(to)
            .value(IconConverter.toHex(value))
            .stepLimit(IconConverter.toBigNumber(stepLimit))
            .nid(IconConverter.toBigNumber(this._nid))
            .nonce(IconConverter.toBigNumber(1))
            .version(IconConverter.toBigNumber(3))
            .timestamp((new Date()).getTime() * 1000)
            .method(method)

        // Optional "params" field
        if (Object.keys(params).length !== 0) {
            callTransactionBuilder = callTransactionBuilder.params(params)
        }

        return callTransactionBuilder.build()
    }

    __icxTransactionBuild(from, to, value, stepLimit) {
        return new IconService.IconBuilder.IcxTransactionBuilder()
            .from(from)
            .to(to)
            .value(IconConverter.toBigNumber(value))
            .stepLimit(IconConverter.toBigNumber(stepLimit))
            .nid(IconConverter.toBigNumber(this._nid))
            .version(IconConverter.toBigNumber(3))
            .timestamp((new Date()).getTime() * 1000)
            .build()
    }

    async __txResult(txHash, retriesLeft = 1000, interval = 100) {
        try {
            return await this._iconService.getTransactionResult(txHash).execute()
        } catch (error) {
            if (retriesLeft) {
                await new Promise((resolve, reject) => setTimeout(resolve, interval))
                return this.__txResult(txHash, retriesLeft - 1, interval)
            } else throw new UnconfirmedTransaction(txHash)
        }
    }
}

export const api = new API(SCORE_NETWORK, SCORE_ENDPOINT)
