import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

import { buildLeaf, buildMerkleTree } from "./merkle";

describe("Mint", function () {
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

		await token.setRole(mint.address, parseInt("0001", 2));

		await mint.setTokenAddress(token.address);

		return { token, mint, owner, accounts };
	}

	it("should deploy", async () => {
		const { token, mint, owner } = await loadFixture(deploy);

		expect(token.address).to.not.be.empty;
		expect(mint.address).to.not.be.empty;
	});

	it("should not be able to mint FT without adding", async () => {
		const { token, mint, owner } = await loadFixture(deploy);

		await expect(mint.mintCrate(owner.address, 0, 1, [])).to.be.reverted;
	});

	it("should not be able to mint when not enabled", async () => {
		const { token, mint, owner } = await loadFixture(deploy);

		await token.addFT(0, 100, true, true);

		await expect(mint.mintCrate(owner.address, 0, 2, [])).to.be.reverted;
	});

	it("should not be able to mint FT without valid proof", async () => {
		const { token, mint, owner, accounts } = await loadFixture(deploy);

		await token.addFT(0, 100, true, true);

		await mint.setEnabled(true);

		await expect(
			mint.connect(accounts[1]).mintCrate(accounts[1].address, 0, 1, [])
		).to.be.reverted;

		expect(await token.balanceOf(owner.address, 0)).to.equal(0);
	});

	it("should be able to mint with a valid proof", async () => {
		const { token, mint, owner, accounts } = await loadFixture(deploy);

		await token.addFT(0, 100, true, true);

		await mint.setEnabled(true);

		const mt = await buildMerkleTree([
			{ address: accounts[1].address, token: 0, quantity: 1 },
			{ address: accounts[2].address, token: 0, quantity: 1 },
			{ address: accounts[3].address, token: 0, quantity: 1 },
			{ address: accounts[4].address, token: 0, quantity: 1 },
			{ address: accounts[5].address, token: 0, quantity: 1 },
		]);

		await mint.setMerkleRoot(mt.root);

		await expect(
			mint.connect(accounts[1]).mintCrate(
				accounts[1].address,
				0,
				1,
				mt.tree.getHexProof(
					buildLeaf({
						address: accounts[1].address,
						token: 0,
						quantity: 1,
					})
				)
			)
		).to.not.be.reverted;

		expect(await token.balanceOf(accounts[1].address, 0)).to.equal(1);
	});

	it("should not be able to mint with a nonexistent proof/quantity combination", async () => {
		const { token, mint, owner, accounts } = await loadFixture(deploy);

		await token.addFT(0, 100, true, true);

		await mint.setEnabled(true);

		const mt = await buildMerkleTree([
			{ address: accounts[1].address, token: 0, quantity: 1 },
			{ address: accounts[2].address, token: 0, quantity: 1 },
			{ address: accounts[3].address, token: 0, quantity: 1 },
			{ address: accounts[4].address, token: 0, quantity: 1 },
			{ address: accounts[5].address, token: 0, quantity: 1 },
		]);

		await mint.setMerkleRoot(mt.root);

		await expect(
			mint.connect(accounts[2]).mintCrate(
				accounts[2].address,
				0,
				2,
				mt.tree.getHexProof(
					buildLeaf({
						address: accounts[2].address,
						token: 0,
						quantity: 2,
					})
				)
			)
		).to.be.reverted;

		expect(await token.balanceOf(accounts[2].address, 0)).to.equal(0);
	});

	it("should not be able to mint with a valid proof that doesn't match", async () => {
		const { token, mint, owner, accounts } = await loadFixture(deploy);

		await token.addFT(0, 100, true, true);

		await mint.setEnabled(true);

		const mt = await buildMerkleTree([
			{ address: accounts[1].address, token: 0, quantity: 1 },
			{ address: accounts[2].address, token: 0, quantity: 1 },
			{ address: accounts[3].address, token: 0, quantity: 1 },
			{ address: accounts[4].address, token: 0, quantity: 1 },
			{ address: accounts[5].address, token: 0, quantity: 1 },
		]);

		await mint.setMerkleRoot(mt.root);

		await expect(
			mint.connect(accounts[2]).mintCrate(
				accounts[2].address,
				1,
				1,
				mt.tree.getHexProof(
					buildLeaf({
						address: accounts[2].address,
						token: 0,
						quantity: 1,
					})
				)
			),
			"wrong token id"
		).to.be.reverted;

		expect(await token.balanceOf(accounts[2].address, 0)).to.equal(0);

		await expect(
			mint.connect(accounts[2]).mintCrate(
				accounts[2].address,
				0,
				2,
				mt.tree.getHexProof(
					buildLeaf({
						address: accounts[2].address,
						token: 0,
						quantity: 1,
					})
				)
			),
			"wrong quantity"
		).to.be.reverted;

		expect(await token.balanceOf(accounts[2].address, 0)).to.equal(0);

		await expect(
			mint.connect(accounts[2]).mintCrate(
				accounts[2].address,
				0,
				1,
				mt.tree.getHexProof(
					buildLeaf({
						address: accounts[2].address,
						token: 0,
						quantity: 1,
					})
				)
			)
		).to.not.be.reverted;

		expect(await token.balanceOf(accounts[2].address, 0)).to.equal(1);

		await expect(
			mint.connect(accounts[2]).mintCrate(
				accounts[2].address,
				0,
				1,
				mt.tree.getHexProof(
					buildLeaf({
						address: accounts[2].address,
						token: 0,
						quantity: 1,
					})
				)
			),
			"already minted"
		).to.be.reverted;

		expect(await token.balanceOf(accounts[2].address, 0)).to.equal(1);
	});
});
