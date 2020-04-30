export const Networks = Object.freeze({
    LOCALHOST: Symbol('LOCALHOST'),
    MAINNET: Symbol('MAINNET'),
    EULJIRO: Symbol('EULJIRO'),
    YEOUIDO: Symbol('YEOUIDO')
})

export const WALLET_LOCAL_STORAGE_KEY = 'wallet'

// SCORE Configuration
// export const SCORE_ENDPOINT = 'cxfbe5703f71d9dc1befb98a91c0a9d37f65e7bed9'
// export const SCORE_NETWORK = Networks.YEOUIDO
export const SCORE_ENDPOINT = "cx7837030a8cdedff92700d2c72108be8058aa9ac5"
export const SCORE_NETWORK = Networks.LOCALHOST
// export const SCORE_ENDPOINT = "cx6f824b1ccc08c13f626b8fc888d8214632cba28a"
// export const SCORE_NETWORK = Networks.MAINNET

// ICX Configuration
export const ICX_TOKEN_CONTRACT = 'cx0000000000000000000000000000000000000000'
export const ICX_TOKEN_DECIMALS = 18

// MAX_ITERATION_LOOP is also defined in SCORE contract
export const MAX_ITERATION_LOOP = 100