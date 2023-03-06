import { ethers } from "hardhat";
import { requireChainID } from "../lib/utils";

async function main() {
	requireChainID(1337, ethers.provider);

	const accounts = await ethers.getSigners();

	const Token = await ethers.getContractFactory("Token");
	const token = await Token.deploy("Bantam Brigade", "BANTAM", "", "");

	const Mint = await ethers.getContractFactory("Mint");
	const mint = await Mint.deploy();

	await token.deployed();
	await mint.deployed();

	console.log(`Token contract deployed to ${token.address}`);
	console.log(`Mint contract deployed to ${mint.address}`);

	{
		console.group("Setting up token");
		console.log(await token.setMintContract(mint.address));
		console.log(await token.addFT(0, 10000, true, true));
		console.log(await token.addFT(0, 10000, true, true));
		console.groupEnd();
	}

	{
		console.group("Sending ETH");
		console.log(
			await accounts[0].sendTransaction({
				to: "0xCcA4bDce6dEDc48fDf86Ac68d75435e54e0b342f",
				value: ethers.utils.parseEther("2"),
			})
		);

		console.log(
			await accounts[0].sendTransaction({
				to: "0x7Fe49D4e65C1087A1cf129D1Ebd67EBbCb5F1EBd",
				value: ethers.utils.parseEther("2"),
			})
		);
		console.groupEnd();
	}

	{
		console.group("Setting up mint");
		console.log(await mint.setTokenAddress(token.address));

		console.log(
			await mint.setMerkleRoot(
				"0xc752ec9b213a1060ae1d23c98763c2e658a0364c0abb662ab5aa4f97632533fc"
			)
		);

		console.log(await mint.setEnabled(true));
		console.groupEnd();
	}
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
