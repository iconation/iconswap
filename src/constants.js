export const Networks = Object.freeze({
    LOCALHOST: Symbol('LOCALHOST'),
    MAINNET: Symbol('MAINNET'),
    EULJIRO: Symbol('EULJIRO'),
    YEOUIDO: Symbol('YEOUIDO')
})

export const WALLET_LOCAL_STORAGE_KEY = 'wallet'

// SCORE Configuration
// export const SCORE_ENDPOINT = 'cxf83517356e3157a23658b89fd5ec685b7073a649'
// export const SCORE_NETWORK = Networks.YEOUIDO
export const SCORE_ENDPOINT = "cxb0b39ba228ab46ee5c8b8f7cdfc3234f704d191b"
export const SCORE_NETWORK = Networks.LOCALHOST
// export const SCORE_ENDPOINT = "cxe116c9b949f63a8575be1b5ff7f8167598d372e7"
// export const SCORE_NETWORK = Networks.MAINNET

// ICX Configuration
export const ICX_TOKEN_CONTRACT = 'cx0000000000000000000000000000000000000000'
export const ICX_TOKEN_DECIMALS = 18

// MAX_ITERATION_LOOP is defined in SCORE contract
export const MAX_ITERATION_LOOP = 100