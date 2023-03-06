import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { bn } from "../lib/utils";

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

describe("Token", function () {
	it("should deploy", async () => {
		const { token, owner } = await loadFixture(deploy);

		expect(token.address).to.not.be.empty;
		expect(await token.connect(owner).uri(0)).to.eq(
			"https://meta.bantambrigade.com/{id}.json"
		);
	});

	it("should allow transfers", async () => {
		const { token, owner, accounts } = await loadFixture(deploy);

		await expect(
			token.connect(owner).adminMintNFT(accounts[1].address, 1, 20)
		).to.not.be.reverted;

		expect(
			await token.connect(owner).balanceOfTier(accounts[1].address, 1)
		).to.equal(20);

		await expect(
			token
				.connect(accounts[1])
				.safeTransferFrom(
					accounts[1].address,
					accounts[2].address,
					"0x1000a",
					1,
					"0x"
				)
		).to.not.be.reverted;

		expect(await token.balanceOf(accounts[1].address, "0x1000a")).to.equal(
			0
		);
		expect(await token.balanceOf(accounts[2].address, "0x1000a")).to.equal(
			1
		);

		expect(await token.balanceOfTier(accounts[1].address, 1)).to.equal(19);
		expect(await token.balanceOfTier(accounts[2].address, 1)).to.equal(1);
	});

	it("should not allow transfers from an account if it's not the msg sender and not approved", async () => {
		const { token, owner, accounts } = await loadFixture(deploy);

		await expect(
			token.connect(owner).adminMintNFT(accounts[1].address, 1, 20)
		).to.not.be.reverted;

		expect(
			await token.connect(owner).balanceOfTier(accounts[1].address, 1)
		).to.equal(20);

		await expect(
			token
				.connect(accounts[2])
				.safeTransferFrom(
					accounts[1].address,
					accounts[2].address,
					"0x10000",
					1,
					"0x"
				)
		).to.be.reverted;
	});

	it("should not allow transfers from an account if it doesn't own the token", async () => {
		const { token, owner, accounts } = await loadFixture(deploy);

		await expect(
			token.connect(owner).adminMintNFT(accounts[1].address, 1, 20)
		).to.not.be.reverted;

		expect(
			await token.connect(owner).balanceOfTier(accounts[1].address, 1)
		).to.equal(20);

		await expect(
			token
				.connect(accounts[2])
				.safeTransferFrom(
					accounts[2].address,
					accounts[1].address,
					"0x10000",
					1,
					"0x"
				)
		).to.be.reverted;
	});

	it("should not allow transfers if the token is paused", async () => {
		const { token, owner, accounts } = await loadFixture(deploy);

		await expect(
			token.connect(owner).adminMintNFT(accounts[1].address, 1, 20)
		).to.not.be.reverted;

		await expect(token.connect(owner).setPaused(true)).to.not.be.reverted;

		await expect(
			token
				.connect(accounts[1])
				.safeTransferFrom(
					accounts[1].address,
					accounts[2].address,
					bn("0x10000"),
					1,
					"0x"
				)
		).to.be.reverted;

		await expect(token.connect(owner).setPaused(false)).to.not.be.reverted;

		await expect(
			token
				.connect(accounts[1])
				.safeTransferFrom(
					accounts[1].address,
					accounts[2].address,
					bn("0x10000"),
					1,
					"0x"
				)
		).to.not.be.reverted;
	});

	it("should allow transfers from an account if it's not the msg sender but is approved", async () => {
		const { token, owner, accounts } = await loadFixture(deploy);

		await expect(
			token.connect(owner).adminMintNFT(accounts[1].address, 1, 20)
		).to.not.be.reverted;

		expect(
			await token.connect(owner).balanceOfTier(accounts[1].address, 1)
		).to.equal(20);

		await expect(
			token
				.connect(accounts[1])
				.setApprovalForAll(accounts[2].address, true)
		).to.not.be.reverted;

		await expect(
			token
				.connect(accounts[2])
				.safeTransferFrom(
					accounts[1].address,
					accounts[2].address,
					"0x10000",
					1,
					"0x"
				)
		).to.not.be.reverted;
	});

	it("should allow batch transfers", async () => {
		const { token, owner, accounts } = await loadFixture(deploy);

		await token.connect(owner).addFT(0, 1000, true, true);

		await expect(
			token.connect(owner).adminMintFT(accounts[1].address, 0, 1)
		).to.not.be.reverted;

		await expect(
			token.connect(owner).adminMintNFT(accounts[1].address, 1, 20)
		).to.not.be.reverted;

		await expect(
			token
				.connect(accounts[1])
				.safeBatchTransferFrom(
					accounts[1].address,
					accounts[2].address,
					[
						bn("0x0"),
						bn("0x10001"),
						bn("0x10002"),
						bn("0x10003"),
						bn("0x10004"),
						bn("0x10005"),
					],
					[1, 1, 1, 1, 1, 1],
					"0x"
				)
		).to.not.be.reverted;

		expect(
			await token
				.connect(accounts[1])
				.balanceOfTier(accounts[1].address, 1)
		).to.equal(15);

		expect(
			await token
				.connect(accounts[2])
				.balanceOfTier(accounts[2].address, 1)
		).to.equal(5);
	});
});

describe("Metadata", async () => {
	it("should deploy with initial metadata", async () => {
		const { token, owner } = await loadFixture(deploy);

		expect(token.address).to.not.be.empty;
		expect(await token.connect(owner).uri(0)).to.eq(
			"https://meta.bantambrigade.com/{id}.json"
		);
	});

	it("should allow changing of metadata by owner", async () => {
		const { token, owner } = await loadFixture(deploy);

		await expect(
			token.setMetadata(
				"Edagirb Matnab",
				"MATNAB",
				"https://www.google.com/contract",
				"https://www.google.com/metadata/{id}"
			)
		).to.not.be.reverted;

		expect(await token.name()).to.equal("Edagirb Matnab");
		expect(await token.symbol()).to.equal("MATNAB");
		expect(await token.contractURI()).to.equal(
			"https://www.google.com/contract"
		);
		expect(await token.uri(0)).to.equal(
			"https://www.google.com/metadata/{id}"
		);
	});
});
