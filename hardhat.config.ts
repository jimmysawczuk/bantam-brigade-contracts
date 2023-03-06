import dotenv from "dotenv";
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-chai-matchers";

dotenv.config();

const config: HardhatUserConfig = {
	defaultNetwork: "hardhat",
	networks: {
		hardhat: {
			accounts: {
				count: 20,
			},
		},
		development: {
			url: "http://127.0.0.1:8545",
			chainId: 1337,
			accounts: {
				mnemonic: process.env.DEVELOPMENT_MNEMONIC,
			},
		},
		goerli: {
			url: process.env.GOERLI_PROVIDER,
			chainId: 5,
			accounts: {
				mnemonic: process.env.GOERLI_MNEMONIC,
			},
		},
		// mainnet: {
		// 	url: process.env.MAINNET_PROVIDER,
		// 	chainId: 1,
		// 	accounts: {
		// 		mnemonic: process.env.MAINNET_MNEMONIC,
		// 	},
		// },
	},

	solidity: {
		compilers: [
			{
				version: "0.8.17",
				settings: {
					optimizer: {
						enabled: true,
						runs: 20000,
					},
				},
			},
		],
	},

	gasReporter: {
		currency: "USD",
		src: "contracts",
		enabled: true,
	},

	etherscan: {
		apiKey: process.env.ETHERSCAN_API_KEY,
	},
};

export default config;
