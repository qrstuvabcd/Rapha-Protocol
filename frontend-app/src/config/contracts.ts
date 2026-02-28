// Mainnet Addresses (Polygon PoS)
export const RAPHA_TOKEN_ADDRESS = "0xB534d54a7c2cb2925926E0ee24654979167E61aA";
export const RAPHA_BOUNTY_FACTORY_ADDRESS = "0xD12F32169d9a32789a36A53c6F1436D28E8d03Bd";

// Previous Deployments
export const RAPHA_REGISTRY_ADDRESS = "0x5468B7d5F4A52d00b4192874598b620e53a0CcA6"; // Registry
export const USDC_ADDRESS = "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359"; // USDC Native

export const RAPHA_BOUNTY_POOL_ABI = [
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_stakeAmount",
                "type": "uint256"
            }
        ],
        "name": "joinPool",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "poolId",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "user",
                "type": "address"
            }
        ],
        "name": "UserJoined",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "submissionId",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "patient",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "string",
                "name": "dataCid",
                "type": "string"
            }
        ],
        "name": "DataSubmitted",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "dataCid",
                "type": "string"
            }
        ],
        "name": "submitData",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "submissionId",
                "type": "uint256"
            },
            {
                "internalType": "bool",
                "name": "isValid",
                "type": "bool"
            }
        ],
        "name": "verifySubmission",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "keeper",
                "type": "address"
            }
        ],
        "name": "isKeeper",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getSubmissionCount",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "submissionId",
                "type": "uint256"
            }
        ],
        "name": "getSubmission",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "address",
                        "name": "patient",
                        "type": "address"
                    },
                    {
                        "internalType": "string",
                        "name": "dataCid",
                        "type": "string"
                    },
                    {
                        "internalType": "bool",
                        "name": "isVerified",
                        "type": "bool"
                    },
                    {
                        "internalType": "bool",
                        "name": "isPaid",
                        "type": "bool"
                    }
                ],
                "internalType": "struct IRaphaBountyPool.Submission",
                "name": "",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
] as const;

export const ERC20_ABI = [
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "spender",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "approve",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "owner",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "spender",
                "type": "address"
            }
        ],
        "name": "allowance",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
] as const;
