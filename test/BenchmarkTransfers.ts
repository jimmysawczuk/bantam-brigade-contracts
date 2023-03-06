import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { bn } from "../lib/utils";

describe("Benchmark - safeTransferFrom", function () {
	async function deploy() {
		const accounts = await ethers.getSigners();
		const owner = accounts[0];
		const provider = ethers.provider;

		const Token = await ethers.getContractFactory("Token");
		const token = await Token.deploy(
			"Bantam Brigade",
			"BANTAM",
			"https://meta.bantambrigade.com/opensea.json",
			"https://meta.bantambrigade.com/{id}.json"
		);

		return { token, owner, accounts, provider };
	}

	it("gas usage for transfers from an ownership block", async () => {
		const numTokens = 10;
		for (let i = 0; i < numTokens; i++) {
			const { token, owner, accounts, provider } = await loadFixture(
				deploy
			);

			await expect(
				token
					.connect(owner)
					.adminMintNFT(accounts[1].address, 1, numTokens)
			).to.not.be.reverted;

			expect(
				await token.connect(owner).balanceOfTier(accounts[1].address, 1)
			).to.equal(numTokens);

			const tokenID = bn("0x10000").add(i);

			await expect(
				token
					.connect(accounts[1])
					.safeTransferFrom(
						accounts[1].address,
						accounts[2].address,
						tokenID,
						1,
						"0x"
					)
					.then(async (txn) => {
						const rcpt = await provider.getTransactionReceipt(
							txn.hash
						);
						console.log(
							`gas used (token ${tokenID.toNumber()}):`,
							rcpt.cumulativeGasUsed.toNumber()
						);
						return txn;
					})
			).to.not.be.reverted;

			expect(
				await token.balanceOf(accounts[1].address, tokenID)
			).to.equal(0);
			expect(
				await token.balanceOf(accounts[2].address, tokenID)
			).to.equal(1);

			expect(await token.balanceOfTier(accounts[1].address, 1)).to.equal(
				numTokens - 1
			);
			expect(await token.balanceOfTier(accounts[2].address, 1)).to.equal(
				1
			);

			for (let j = 0; j < numTokens; j++) {
				expect(await token.ownerOf(bn("0x10000").add(j))).to.equal(
					i == j ? accounts[2].address : accounts[1].address
				);
			}
		}
	});

	it("gas usage for transfers (no new ownership blocks needed)", async () => {
		const { token, owner, accounts, provider } = await loadFixture(deploy);

		const num = 10;

		for (let i = 0; i < num; i++) {
			await expect(
				token.connect(owner).adminMintNFT(accounts[i].address, 1, 1)
			).to.not.be.reverted;
		}

		for (let i = 0; i < num; i++) {
			expect(
				await token.connect(owner).balanceOfTier(accounts[i].address, 1)
			).to.equal(1);
		}

		for (let i = 0; i < num; i++) {
			const tokenID = bn("0x10000").add(i);

			await expect(
				token
					.connect(accounts[i])
					.safeTransferFrom(
						accounts[i].address,
						accounts[i + num].address,
						tokenID,
						1,
						"0x"
					)
					.then(async (txn) => {
						const rcpt = await provider.getTransactionReceipt(
							txn.hash
						);
						console.log(
							`gas used (token ${tokenID.toNumber()}):`,
							rcpt.cumulativeGasUsed.toNumber()
						);
						return txn;
					})
			).to.not.be.reverted;
		}

		for (let i = 0; i < num; i++) {
			expect(
				await token.connect(owner).balanceOfTier(accounts[i].address, 1)
			).to.equal(0);
		}

		for (let i = num; i < num * 2; i++) {
			expect(
				await token.connect(owner).balanceOfTier(accounts[i].address, 1)
			).to.equal(1);
		}
	});
});
