import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { bn } from "../lib/utils";

describe("Benchmark - breakCrate", function () {
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

		const Burn = await ethers.getContractFactory("Burn");
		const burn = await Burn.deploy();

		await token.setRole(burn.address, parseInt("1010", 2));

		await burn.setTokenAddress(token.address);

		await token.addFT(0, 100, true, true);
		await token.addFT(0, 100, true, true);

		return { token, burn, owner, accounts, provider };
	}

	it("gas usage for breaking crates", async () => {
		for (let i = 1; i <= 10; i++) {
			const { token, burn, owner, accounts, provider } =
				await loadFixture(deploy);

			await expect(token.adminMintFT(accounts[1].address, 0, i)).to.not.be
				.reverted;

			expect(
				await token
					.connect(accounts[1])
					.balanceOf(accounts[1].address, 0)
			).to.equal(i);

			await expect(
				burn
					.connect(accounts[1])
					.breakCrate(accounts[1].address, 0, i, "0x")
					.then(async (txn) => {
						const rcpt = await provider.getTransactionReceipt(
							txn.hash
						);
						console.log(
							`gas used (${i}x crates of 20):`,
							rcpt.cumulativeGasUsed.toNumber()
						);
						return txn;
					})
			).to.not.be.reverted;
		}

		for (let i = 1; i <= 10; i++) {
			const { token, burn, owner, accounts, provider } =
				await loadFixture(deploy);

			await expect(token.adminMintFT(accounts[1].address, 1, i)).to.not.be
				.reverted;

			expect(
				await token
					.connect(accounts[1])
					.balanceOf(accounts[1].address, 1)
			).to.equal(i);

			await expect(
				burn
					.connect(accounts[1])
					.breakCrate(accounts[1].address, 1, i, "0x")
					.then(async (txn) => {
						const rcpt = await provider.getTransactionReceipt(
							txn.hash
						);
						console.log(
							`gas used (${i}x crates of 5):`,
							rcpt.cumulativeGasUsed.toNumber()
						);
						return txn;
					})
			).to.not.be.reverted;
		}
	});
});
