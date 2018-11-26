export const dataFactoryABI = [
  {
    constant: false,
    inputs: [
      {
        name: '_owner',
        type: 'address'
      },
      {
        name: '_location',
        type: 'address'
      },
      {
        name: '_locationId',
        type: 'bytes'
      },
      {
        name: '_signature',
        type: 'bytes'
      }
    ],
    name: 'storeData',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: false,
    inputs: [
      {
        name: '_owner',
        type: 'address'
      },
      {
        name: '_location',
        type: 'address'
      },
      {
        name: '_locationId',
        type: 'bytes'
      },
      {
        name: '_signature',
        type: 'bytes'
      },
      {
        name: '_signatureFunc',
        type: 'bytes'
      }
    ],
    name: 'storeData',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        name: '_hartAddress',
        type: 'address'
      }
    ],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'constructor'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        name: 'contractDataAddress',
        type: 'address'
      },
      {
        indexed: false,
        name: 'owner',
        type: 'address'
      },
      {
        indexed: false,
        name: 'location',
        type: 'address'
      },
      {
        indexed: false,
        name: 'locationId',
        type: 'bytes'
      },
      {
        indexed: false,
        name: 'signature',
        type: 'bytes'
      },
      {
        indexed: false,
        name: 'signatureFunc',
        type: 'bytes'
      }
    ],
    name: 'DataCreationLog',
    type: 'event'
  },
  {
    constant: true,
    inputs: [
      {
        name: '_owner',
        type: 'address'
      }
    ],
    name: 'getDataTotalByOwner',
    outputs: [
      {
        name: '',
        type: 'uint256'
      }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [
      {
        name: '',
        type: 'address'
      },
      {
        name: '',
        type: 'uint256'
      }
    ],
    name: 'ownerDataAddress',
    outputs: [
      {
        name: '',
        type: 'address'
      }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  }
];

/* export const dataFactoryABI = [
	{
		"constant": false,
		"inputs": [
			{
				"name": "to",
				"type": "address"
			}
		],
		"name": "delegate",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "toVoter",
				"type": "address"
			}
		],
		"name": "giveRightToVote",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"name": "_numProposals",
				"type": "uint8"
			}
		],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "toProposal",
				"type": "uint8"
			}
		],
		"name": "vote",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "winningProposal",
		"outputs": [
			{
				"name": "_winningProposal",
				"type": "uint8"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	}
]; */