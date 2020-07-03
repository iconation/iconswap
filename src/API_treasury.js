import IconService, { IconConverter } from 'icon-sdk-js'
import { SCORE_NETWORK, Networks, ICX_TOKEN_CONTRACT, ICX_TOKEN_DECIMALS, MAX_ITERATION_LOOP, TREASURY_SCORE_ENDPOINT } from './constants'

// ================================================
//  Constants
// ================================================
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

        this._nid = iconNetworkInfo.nid
        this._network = network
        this._scoreAddress = scoreAddress
    }

    _getIconService() {
        return new IconService(new IconService.HttpProvider(this.getAPIEndpoint() + '/api/v3'))
    }

    _getDebugIconService() {
        return new IconService(new IconService.HttpProvider(this.getAPIEndpoint() + '/api/debug/v3'))
    }

    _getNetworkInfo(network) {
        const iconNetworksInfo = []
        iconNetworksInfo[Networks.LOCALHOST] = {
            name: 'localhost',
            api: ['http://127.0.0.1:9000'],
            tracker: 'http://127.0.0.1:9000',
            nid: 0
        }
        iconNetworksInfo[Networks.MAINNET] = {
            name: 'MainNet',
            api: ['https://ctz.solidwallet.io'],
            tracker: 'https://tracker.icon.foundation',
            nid: 1
        }
        iconNetworksInfo[Networks.EULJIRO] = {
            name: 'Euljiro (TestNet)',
            api: ['https://test-ctz.solidwallet.io'],
            tracker: 'https://trackerdev.icon.foundation',
            nid: 2
        }
        iconNetworksInfo[Networks.YEOUIDO] = {
            name: 'Yeouido (TestNet)',
            api: ['https://bicon.net.solidwallet.io'],
            tracker: 'https://bicon.tracker.solidwallet.io',
            nid: 3
        }
        return iconNetworksInfo[network]
    }

    getAPIEndpoint() {
        const apis = this._getNetworkInfo(this._network).api
        return apis[Math.floor(Math.random() * apis.length)];
    }

    getTrackerEndpoint() {
        return this._getNetworkInfo(this._network).tracker
    }

    getNetworkName() {
        return this._getNetworkInfo(this._network).name
    }

    isMaintenanceEnabled() {
        return this.__call(this._scoreAddress, 'maintenance_enabled').then(status => {
            return parseInt(status, 16) === 1
        })
    }

    icxFundsExcess() {
        return this.__call(this._scoreAddress, 'icx_funds_excess').then(result => {
            return parseInt(result, 16)
        })
    }

    async getVersion() {
        try {
            return await this.__call(this._scoreAddress, 'version')
        } catch (exception) {
            console.log(exception)
            return '0.4.0'
        }
    }

    // IRC2 Token Interface ============================================================
    tokenName(contract) {
        if (contract === ICX_TOKEN_CONTRACT) {
            return new Promise((resolve, reject) => {
                resolve('ICX')
            })
        }
        return this.__call(contract, 'name')
    }
    tokenSymbol(contract) {
        if (contract === ICX_TOKEN_CONTRACT) {
            return new Promise((resolve, reject) => {
                resolve('ICX')
            })
        }
        return this.__call(contract, 'symbol')
    }

    // ICONex Connect Extension =============================================================
    iconexHasAccount() {
        return this.__iconexConnectRequest('REQUEST_HAS_ACCOUNT')
    }

    iconexHasAddress(address) {
        return this.__iconexConnectRequest('REQUEST_HAS_ADDRESS', address)
    }

    iconexAskAddress() {
        return this.__iconexConnectRequest('REQUEST_ADDRESS')
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
        return this.__iconexConnectRequest('REQUEST_JSON-RPC', jsonRpcQuery)
    }

    // ======================================================================================
    __getIcxBalance(address) {
        return this._getIconService().getBalance(address).execute()
    }

    __getIRC2Balance(address, contract) {
        return this.__call(contract, 'balanceOf', { '_owner': address })
    }


    getBalance(address, contract) {
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
                const result = this._getIconService().call(call).execute()
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
                const result = this._getIconService().sendTransaction(transaction).execute()
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
                const result = this._getDebugIconService().provider.request(transaction).execute()
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
            return await this._getIconService().getTransactionResult(txHash).execute()
        } catch (error) {
            if (retriesLeft) {
                await new Promise((resolve, reject) => setTimeout(resolve, interval))
                return this.__txResult(txHash, retriesLeft - 1, interval)
            } else throw new UnconfirmedTransaction(txHash)
        }
    }
}

export const treasuryAPI = new API(SCORE_NETWORK, TREASURY_SCORE_ENDPOINT)
