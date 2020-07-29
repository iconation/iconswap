export const Networks = Object.freeze({
    LOCALHOST: Symbol('LOCALHOST'),
    MAINNET: Symbol('MAINNET'),
    EULJIRO: Symbol('EULJIRO'),
    YEOUIDO: Symbol('YEOUIDO')
})

export const WALLET_LOCAL_STORAGE_KEY = 'wallet'

// SCORE Configuration
// export const SCORE_ENDPOINT = 'cx90d86f087c70187d1a054473887165815f6251a8'
// export const SCORE_NETWORK = Networks.YEOUIDO
// export const SCORE_ENDPOINT = "cx0c48b9f4df155a6bb6495e76fcb1e75313374972"
// export const TREASURY_SCORE_ENDPOINT = "cx48a17633c43b1802af20cbea4f4f0629e298ce36"
// export const TAP_TOKEN_CONTRACT = "cx73a4e75fd7d5ff1153b8f0978558764896f60eee"
// export const SCORE_NETWORK = Networks.LOCALHOST
export const SCORE_ENDPOINT = "cx6f824b1ccc08c13f626b8fc888d8214632cba28a"
export const SCORE_NETWORK = Networks.MAINNET
export const TREASURY_SCORE_ENDPOINT = "cxce68b59d5facc473ca4721a5be473ee569d0f576"
export const TAP_TOKEN_CONTRACT = "cxc0b5b52c9f8b4251a47e91dda3bd61e5512cd782"

// ICX Configuration
export const ICX_TOKEN_CONTRACT = 'cx0000000000000000000000000000000000000000'
export const ICX_TOKEN_DECIMALS = 18

// MAX_ITERATION_LOOP is also defined in SCORE contract
export const MAX_ITERATION_LOOP = 100

export const EMPTY_ORDER_PROVIDER = 'hx0000000000000000000000000000000000000000'