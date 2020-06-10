import IconService, { IconConverter } from 'icon-sdk-js'
import { SCORE_NETWORK, SCORE_ENDPOINT, Networks, ICX_TOKEN_CONTRACT, ICX_TOKEN_DECIMALS, MAX_ITERATION_LOOP } from './constants'
import { unitToBalanceEx } from './utils'

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

    progressPromiseAll(promises, tickCallback) {
        var len = promises.length;
        var progress = 0;

        function tick(promise) {
            promise.then(function () {
                progress++;
                tickCallback(progress, len);
            });
            return promise;
        }

        return Promise.all(promises.map(tick));
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

    getWhitelist() {
        return this.__callWithOffset(this._scoreAddress, 'get_whitelist').then(whitelist => {
            return whitelist
        })
    }

    isMaintenanceEnabled() {
        return this.__call(this._scoreAddress, 'maintenance_enabled').then(status => {
            return parseInt(status, 16) === 1
        })
    }

    async getVersion() {
        try {
            return await this.__call(this._scoreAddress, 'version')
        } catch (exception) {
            return '0.4.0'
        }
    }

    getSwap(swapId) {
        return this.__call(this._scoreAddress, 'get_swap', {
            swap_id: IconConverter.toHex(swapId)
        })
    }

    getMarketInfo() {
        return this.__callWithOffset(this._scoreAddress, 'get_market_info')
    }


    getMarketBuyersPendingSwaps(pair) {
        return this.__callWithOffset(this._scoreAddress, 'get_market_buyers_pending_swaps', { 'pair': pair })
    }


    getMarketSellerPendingSwaps(pair) {
        return this.__callWithOffset(this._scoreAddress, 'get_market_sellers_pending_swaps', { 'pair': pair })
    }

    getMarketFilledSwaps(pair, offset) {
        return this.__call(this._scoreAddress, 'get_market_filled_swaps', {
            'offset': IconConverter.toHex(offset),
            'pair': pair
        })
    }

    getManyMarketFilledSwaps(pair, offset, count) {
        var curOffset = offset;
        var promises = []

        for (var curOffset = offset; curOffset < count; curOffset += MAX_ITERATION_LOOP) {
            promises.push(
                this.__call(this._scoreAddress, 'get_market_filled_swaps', {
                    offset: IconConverter.toHex(curOffset),
                    pair: pair
                })
            )
        }

        return Promise.allSettled(promises).then(result => {
            result = result.filter(item => item.status == "fulfilled")
            result = result.map(item => item.value)
            return Array.prototype.concat.apply([], result);
        })
    }

    getOrder(orderId) {
        return this.__call(this._scoreAddress, 'get_order', {
            order_id: IconConverter.toHex(orderId)
        })
    }

    getTokenDetails(wallet, contract) {
        return api.getBalance(wallet, contract).then(balance => {
            if (contract === ICX_TOKEN_CONTRACT) {
                const digits = IconConverter.toBigNumber('10').exponentiatedBy(ICX_TOKEN_DECIMALS)
                balance = IconConverter.toBigNumber(balance).dividedBy(digits).toString()
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
                        const digits = IconConverter.toBigNumber('10').exponentiatedBy(ICX_TOKEN_DECIMALS)
                        balance = IconConverter.toBigNumber(balance).dividedBy(digits).toString()
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

    async __callWithOffset(contract, method, params = {}) {
        let result = []
        let offset = 0
        let running = true

        while (running) {
            params['offset'] = IconConverter.toHex(offset)
            try {
                const items = await this.__call(contract, method, params)
                result = result.concat(items)
                offset += MAX_ITERATION_LOOP
            } catch (error) {
                if (error.includes('StopIteration')) {
                    running = false
                }
                else throw error
            }
        }

        return result
    }

    getPendingOrdersByAddress(walletAddress) {
        return this.__callWithOffset(this._scoreAddress, 'get_account_pending_swaps', {
            address: walletAddress
        })
    }

    getFilledOrdersByAddress(walletAddress) {
        return this.__callWithOffset(this._scoreAddress, 'get_account_filled_swaps', {
            address: walletAddress
        })
    }

    marketCreateLimitOrder(walletAddress, maker_contract, maker_amount, taker_contract, taker_amount) {

        // Convert amount to bigint
        Promise.all([unitToBalanceEx(maker_amount, maker_contract), unitToBalanceEx(taker_amount, taker_contract)]).then(([maker_amount, taker_amount]) => {

            if (maker_contract === ICX_TOKEN_CONTRACT) {
                return this.__iconexCallTransaction(
                    walletAddress,
                    this._scoreAddress,
                    'market_create_limit_icx_order',
                    IconConverter.toHex(maker_amount),
                    {
                        taker_contract: taker_contract,
                        taker_amount: IconConverter.toHex(taker_amount)
                    }
                )
            } else {
                const data = {
                    'action': 'market_create_limit_irc2_order',
                    'taker_contract': taker_contract,
                    'taker_amount': IconConverter.toHex(taker_amount)
                }
                const params = {
                    '_to': this._scoreAddress,
                    '_value': IconConverter.toHex(maker_amount),
                    '_data': IconConverter.toHex(JSON.stringify(data))
                }
                return this.__iconexCallTransaction(
                    walletAddress,
                    maker_contract,
                    'transfer',
                    0,
                    params
                )
            }
        })
    }

    fillOrder(walletAddress, swapId, taker_contract, taker_amount) {
        swapId = IconConverter.toHex(swapId)
        if (taker_contract === ICX_TOKEN_CONTRACT) {
            const value = IconConverter.toHex(taker_amount)
            return this.__iconexCallTransaction(
                walletAddress,
                this._scoreAddress,
                'fill_icx_order',
                value, { swap_id: swapId }
            )
        } else {
            const value = IconConverter.toHex(taker_amount)
            const data = {
                'action': 'fill_irc2_order',
                'swap_id': swapId
            }
            return this.__iconexCallTransaction(walletAddress, taker_contract, 'transfer', 0, {
                '_to': this._scoreAddress,
                '_value': value,
                '_data': IconConverter.toHex(JSON.stringify(data))
            })
        }
    }

    cancelSwap(walletAddress, swapId) {
        return this.__iconexCallTransaction(walletAddress, this._scoreAddress, 'cancel_swap', 0, {
            swap_id: IconConverter.toHex(swapId)
        })
    }

    createSwap(walletAddress, maker_contract, maker_amount, taker_contract, taker_amount, taker_address) {
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
            let params = {
                taker_contract: taker_contract,
                taker_amount: IconConverter.toHex(IconConverter.toBigNumber(taker_amount)),
            }
            if (taker_address) {
                params["taker_address"] = taker_address
            }
            return this.__iconexCallTransaction(walletAddress, this._scoreAddress, 'create_icx_swap', maker_amount, params)
                .then(async tx => {
                    return getSwapIdFromTx(tx)
                })
        } else {
            const value = IconConverter.toHex(maker_amount)
            let data = {
                'action': 'create_irc2_swap',
                'taker_contract': taker_contract,
                'taker_amount': IconConverter.toHex(IconConverter.toBigNumber(taker_amount)),
            }
            if (taker_address) {
                data["taker_address"] = taker_address
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

    // admin
    cancelSwapAdmin(walletAddress, swapId) {
        return this.__iconexCallTransaction(
            walletAddress,
            this._scoreAddress,
            'cancel_swap_admin', 0,
            {
                swap_id: IconConverter.toHex(swapId)
            }
        )
    }

    forceSwapFactoryId(walletAddress, uid) {
        return this.__iconexCallTransaction(
            walletAddress,
            this._scoreAddress,
            'force_swap_factory_id', 0,
            {
                uid: IconConverter.toHex(uid)
            }
        )
    }

    forceOrderFactoryId(walletAddress, uid) {
        return this.__iconexCallTransaction(
            walletAddress,
            this._scoreAddress,
            'force_order_factory_id', 0,
            {
                uid: IconConverter.toHex(uid)
            }
        )
    }

    setMaintenanceMode(walletAddress, mode) {
        return this.__iconexCallTransaction(
            walletAddress,
            this._scoreAddress,
            'set_maintenance_mode', 0,
            {
                mode: IconConverter.toHex(mode)
            }
        )
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

export const api = new API(SCORE_NETWORK, SCORE_ENDPOINT)
