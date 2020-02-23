export const Networks = Object.freeze({
    LOCALHOST: Symbol('LOCALHOST'),
    MAINNET: Symbol('MAINNET'),
    EULJIRO: Symbol('EULJIRO'),
    YEOUIDO: Symbol('YEOUIDO')
})

export const WALLET_LOCAL_STORAGE_KEY = 'wallet'

// SCORE Configuration
export const SCORE_ENDPOINT = 'cx875745968f7e01104bd7b3deafc2492851801440'
export const SCORE_NETWORK = Networks.YEOUIDO
// export const SCORE_ENDPOINT = "cx17b53a38661427590e0e5022e0d452a9f7fc4432"
// export const SCORE_NETWORK = Networks.LOCALHOST

// ICX Configuration
export const ICX_TOKEN_CONTRACT = 'cx0000000000000000000000000000000000000000'
export const ICX_TOKEN_DECIMALS = 18