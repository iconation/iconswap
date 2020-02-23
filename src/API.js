import IconService from 'icon-sdk-js'
import { SCORE_NETWORK, SCORE_ENDPOINT, Networks, ICX_TOKEN_CONTRACT, ICX_TOKEN_DECIMALS } from './constants'

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

        const url = iconNetworkInfo.url
        const httpProvider = new IconService.HttpProvider(url + '/api/v3')
        const httpDebugProvider = new IconService.HttpProvider(url + '/api/debug/v3')

        this._nid = iconNetworkInfo.nid
        this._network = network
        this._iconService = new IconService(httpProvider)
        this._iconDebugService = new IconService(httpDebugProvider)
        this._scoreAddress = scoreAddress
    }

    _getNetworkInfo(network) {
        const iconNetworksInfo = []
        iconNetworksInfo[Networks.LOCALHOST] = { url: 'http://127.0.0.1:9000', nid: 0 }
        iconNetworksInfo[Networks.MAINNET] = { url: 'https://ctz.solidwallet.io', nid: 1 }
        iconNetworksInfo[Networks.EULJIRO] = { url: 'https://test-ctz.solidwallet.io', nid: 2 }
        iconNetworksInfo[Networks.YEOUIDO] = { url: 'https://bicon.net.solidwallet.io', nid: 3 }
        return iconNetworksInfo[network]
    }

    getEndpoint() {
        return this._getNetworkInfo(Networks.MAINNET).url
    }

    getWhitelist() {
        return this.__call(this._scoreAddress, 'get_whitelist').then(whitelist => {
            return whitelist
        })
    }

    getSwap(swapId) {
        return api.__call(this._scoreAddress, 'get_swap', { swapid: swapId }).then(swap => {
            return swap
        })
    }

    getOrder(orderId) {
        return api.__call(this._scoreAddress, 'get_order', { orderid: orderId }).then(swap => {
            return swap
        })
    }

    getDecimals(contract) {
        if (contract === ICX_TOKEN_CONTRACT) {
            return new Promise((resolve, reject) => {
                resolve(ICX_TOKEN_DECIMALS)
            })
        }
        return api.__call(contract, 'decimals').then(decimals => {
            return decimals
        })
    }

    fulfillIcxOrder(walletAddress, order) {
        const value = IconService.IconConverter.toHex(order['amount'])
        return api.__iconexCallTransaction(walletAddress, this._scoreAddress, 'fulfill_icx_order', value, { orderid: order['id'] }).then(txHash => {
            return txHash
        })
    }

    fulfillIRC2Order(walletAddress, order) {
        const value = IconService.IconConverter.toHex(order['amount'])
        return api.__iconexCallTransaction(walletAddress, order['contract'], 'transfer', 0, {
            '_to': this._scoreAddress,
            '_value': value,
            '_data': IconService.IconConverter.toHex(order['id'])
        }).then(txHash => {
            return txHash
        })
    }

    doSwap(walletAddress, swapId) {
        return api.__iconexCallTransaction(walletAddress, this._scoreAddress, 'do_swap', 0, { swapid: swapId }).then(txHash => {
            return txHash
        })
    }

    cancelSwap(walletAddress, swapId) {
        return api.__iconexCallTransaction(walletAddress, this._scoreAddress, 'cancel_swap', 0, { swapid: swapId }).then(txHash => {
            return txHash
        })
    }

    createSwap(walletAddress, contract1, amount1, contract2, amount2) {
        const params = {
            contract1: contract1,
            amount1: IconService.IconConverter.toHex(IconService.IconConverter.toBigNumber(amount1)),
            contract2: contract2,
            amount2: IconService.IconConverter.toHex(IconService.IconConverter.toBigNumber(amount2))
        }
        return this.__iconexCallTransaction(walletAddress, this._scoreAddress, 'create_swap', 0, params)
            .then(async tx => {
                const txHash = tx['result']
                const txResult = await this.__txResult(txHash)
                const eventLogs = txResult['eventLogs'][0]
                if (eventLogs['indexed'][0] !== SwapCreatedEvent) {
                    throw WrongEventSignature(eventLogs['indexed']);
                }
                console.log(txResult)
                const swapId = parseInt(eventLogs['indexed'][1], 16)
                const order1 = parseInt(eventLogs['data'][0], 16)
                const order2 = parseInt(eventLogs['data'][1], 16)
                return { swapId: swapId, order1: order1, order2: order2 }
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
            params: IconService.IconConverter.toRawTransaction(transaction),
            id: 1234
        }
        return this.__iconexJsonRpc(jsonRpcQuery)
    }

    __iconexCallTransaction(from, to, method, value, params) {
        return api.__estimateCallStep(from, to, method, value, params).then(stepLimit => {
            return api.__iconexCallTransactionEx(from, to, method, value, stepLimit, params)
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

    __iconexJsonRpc(jsonRpcQuery) {
        return this.__iconexConnectRequest('REQUEST_JSON-RPC', jsonRpcQuery).then(payload => {
            return payload
        })
    }

    // ======================================================================================
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
                    .value(IconService.IconConverter.toHex(IconService.IconAmount.of(value, IconService.IconAmount.Unit.ICX).toLoop()))
                    .stepLimit(IconService.IconConverter.toBigNumber(stepLimit)) // 40000000
                    .nid(IconService.IconConverter.toBigNumber(this._nid))
                    .nonce(IconService.IconConverter.toBigNumber(1))
                    .version(IconService.IconConverter.toBigNumber(3))
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
                "value": IconService.IconConverter.toHex(IconService.IconConverter.toBigNumber(value)),
                "timestamp": IconService.IconConverter.toHex((new Date()).getTime() * 1000),
                "nid": IconService.IconConverter.toHex(IconService.IconConverter.toBigNumber(this._nid)),
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
            .value(IconService.IconConverter.toHex(value))
            .stepLimit(IconService.IconConverter.toBigNumber(stepLimit))
            .nid(IconService.IconConverter.toBigNumber(this._nid))
            .nonce(IconService.IconConverter.toBigNumber(1))
            .version(IconService.IconConverter.toBigNumber(3))
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
            .value(IconService.IconConverter.toBigNumber(value))
            .stepLimit(IconService.IconConverter.toBigNumber(stepLimit))
            .nid(IconService.IconConverter.toBigNumber(this._nid))
            .version(IconService.IconConverter.toBigNumber(3))
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
