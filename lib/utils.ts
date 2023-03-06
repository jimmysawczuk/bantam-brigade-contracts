import { BigNumber } from "ethers";

export function bn(input: any): BigNumber {
	return BigNumber.from(input);
}

export async function requireChainID(chainID: number, provider: any) {
	const c = (await provider.getNetwork()).chainId;
	if (c !== chainID) {
		throw new Error(
			`Unexpected chain ID (expected: ${chainID}, got: ${c})`
		);
	}
}
