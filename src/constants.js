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
// export const SCORE_ENDPOINT = "cxe2c3a12039f9f9d9e90655faadd557abebde9cf3"
// export const SCORE_NETWORK = Networks.LOCALHOST
export const SCORE_ENDPOINT = "cxab5384cf1752def036a22730acd5f009f7345619"
export const SCORE_NETWORK = Networks.MAINNET

// ICX Configuration
export const ICX_TOKEN_CONTRACT = 'cx0000000000000000000000000000000000000000'
export const ICX_TOKEN_DECIMALS = 18

// MAX_ITERATION_LOOP is also defined in SCORE contract
export const MAX_ITERATION_LOOP = 100