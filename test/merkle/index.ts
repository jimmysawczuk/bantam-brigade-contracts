import { keccak256 } from "ethers/lib/utils";
import MerkleTree from "merkletreejs";
import type { BigNumberish } from "ethers";
import { ethers } from "ethers";

interface Entry {
	address: string;
	token: BigNumberish;
	quantity: BigNumberish;
}

export async function buildMerkleTree(entries: Array<Entry>) {
	const leaves = entries.map(buildLeaf);

	const tree = new MerkleTree(leaves, keccak256, { sort: true });

	const root = tree.getHexRoot();

	return {
		tree,
		root,
		leaves,
	};
}

export function buildLeaf(entry: Entry): string {
	return ethers.utils.solidityKeccak256(
		["address", "uint256", "uint256"],
		[entry.address, entry.token, entry.quantity]
	);
}
