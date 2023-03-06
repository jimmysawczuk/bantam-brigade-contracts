import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { bn } from "../lib/utils";

describe("Burn", function () {
	async function deploy() {
		const accounts = await ethers.getSigners();
		const owner = accounts[0];

		const Token = await ethers.getContractFactory("Token");
		const token = await Token.deploy(
			"Bantam Brigade",
			"BANTAM",
			"https://meta.bantambrigade.com/opensea.json",
			"https://meta.bantambrigade.com/{id}.json"
		);

		const Mint = await ethers.getContractFactory("Mint");
		const mint = await Mint.deploy();

		const Burn = await ethers.getContractFactory("Burn");
		const burn = await Burn.deploy();

		await mint.setTokenAddress(token.address);
		await burn.setTokenAddress(token.address);
		await token.setMintContract(mint.address);
		await token.setBurnContract(burn.address);

		await token.addFT(0, 100, true, true);
		await token.addFT(0, 1000, true, true);
		await token.addFT(0, 10000, true, true);

		return { token, mint, burn, owner, accounts };
	}

	it("should deploy", async () => {
		const { token, mint, burn, owner } = await loadFixture(deploy);

		expect(token.address).to.not.be.empty;
		expect(mint.address).to.not.be.empty;
		expect(burn.address).to.not.be.empty;
	});

	it("should be able to mint FT and burn for NFTs (tier 0 crate)", async () => {
		const { token, mint, burn, owner, accounts } = await loadFixture(
			deploy
		);

		await expect(mint.adminMintCrate(accounts[1].address, 0, 1)).to.not.be
			.reverted;

		expect(await token.balanceOf(accounts[1].address, 0)).to.equal(1);

		// Should revert because owner doesn't have anything
		await expect(burn.connect(owner).breakCrate(owner.address, 0, 1, "0x"))
			.to.be.reverted;

		await expect(
			await burn
				.connect(accounts[1])
				.breakCrate(accounts[1].address, 0, 1, "0x")
		).to.not.be.reverted;

		for (let i = bn("0x10000"); i.lt(bn("0x10014")); i = i.add(1)) {
			expect(
				await token.ownerOf(i),
				`Owner: account #1, Token ${i.toHexString()}`
			).to.equal(accounts[1].address);

			expect(
				await token.balanceOf(accounts[1].address, i),
				`Balance: account #1, Token ${i.toHexString()}`
			).to.equal(1);
		}

		expect(await token.balanceOf(accounts[1].address, 0)).to.equal(0);
		expect(await token.balanceOfTier(accounts[1].address, 1)).to.equal(20);
	});

	it("should be able to mint FT and burn for NFTs (tier 1 crate)", async () => {
		const { token, mint, burn, owner, accounts } = await loadFixture(
			deploy
		);

		await expect(mint.adminMintCrate(accounts[1].address, 1, 1)).to.not.be
			.reverted;

		expect(await token.balanceOf(accounts[1].address, 1)).to.equal(1);

		await expect(
			await burn
				.connect(accounts[1])
				.breakCrate(accounts[1].address, 1, 1, "0x")
		).to.not.be.reverted;

		for (let i = bn("0x10000"); i.lt(bn("0x10005")); i = i.add(1)) {
			expect(await token.balanceOf(accounts[1].address, i)).to.equal(1);
		}

		expect(await token.balanceOf(accounts[1].address, 1)).to.equal(0);
		expect(await token.balanceOfTier(accounts[1].address, 1)).to.equal(5);
	});

	it("should be able to mint FT and burn for NFTs (tier 2 crate)", async () => {
		const { token, mint, burn, owner, accounts } = await loadFixture(
			deploy
		);

		await expect(mint.adminMintCrate(accounts[1].address, 2, 1)).to.not.be
			.reverted;

		expect(await token.balanceOf(accounts[1].address, 2)).to.equal(1);

		await expect(
			await burn
				.connect(accounts[1])
				.breakCrate(accounts[1].address, 2, 1, "0x")
		).to.not.be.reverted;

		for (
			let i = bn("0x100000000000000"); // 2**56
			i.lt(bn("0x100000000000014")); // 2**56+20
			i = i.add(1)
		) {
			expect(await token.balanceOf(accounts[1].address, i)).to.equal(1);
		}

		expect(await token.balanceOf(accounts[1].address, 2)).to.equal(0);
		expect(await token.balanceOfTier(accounts[1].address, 2)).to.equal(20);
	});

	it("should be able to mint FT and burn for NFTs (tier 0 crate x2)", async () => {
		const { token, mint, burn, owner, accounts } = await loadFixture(
			deploy
		);

		await expect(mint.adminMintCrate(accounts[1].address, 0, 2)).to.not.be
			.reverted;

		expect(await token.balanceOf(accounts[1].address, 0)).to.equal(2);

		await expect(
			await burn
				.connect(accounts[1])
				.breakCrate(accounts[1].address, 0, 2, "0x")
		).to.not.be.reverted;

		for (let i = bn("0x10000"); i.lt(bn("0x10028")); i = i.add(1)) {
			expect(
				await token.ownerOf(i),
				`Owner: account #1, Token ${i.toHexString()}`
			).to.equal(accounts[1].address);

			expect(
				await token.balanceOf(accounts[1].address, i),
				`Balance: account #1, Token ${i.toHexString()}`
			).to.equal(1);
		}

		expect(await token.balanceOf(accounts[1].address, 0)).to.equal(0);
		expect(await token.balanceOfTier(accounts[1].address, 1)).to.equal(40);
	});

	it("should be able to mint FT and burn for NFTs (tier 0 crate x4)", async () => {
		const { token, mint, burn, owner, accounts } = await loadFixture(
			deploy
		);

		await expect(mint.adminMintCrate(accounts[1].address, 0, 4)).to.not.be
			.reverted;

		expect(await token.balanceOf(accounts[1].address, 0)).to.equal(4);

		await expect(
			await burn
				.connect(accounts[1])
				.breakCrate(accounts[1].address, 0, 4, "0x")
		).to.not.be.reverted;

		for (let i = bn("0x10000"); i.lt(bn("0x10050")); i = i.add(1)) {
			expect(
				await token.ownerOf(i),
				`Owner: account #1, Token ${i.toHexString()}`
			).to.equal(accounts[1].address);

			expect(
				await token.balanceOf(accounts[1].address, i),
				`Balance: account #1, Token ${i.toHexString()}`
			).to.equal(1);
		}

		expect(await token.balanceOf(accounts[1].address, 0)).to.equal(0);
		expect(await token.balanceOfTier(accounts[1].address, 1)).to.equal(80);
	});
});
