import { ethers } from "hardhat";
import { requireChainID } from "../lib/utils";

async function main() {
	requireChainID(5, ethers.provider);

	const accounts = await ethers.getSigners();

	const Token = await ethers.getContractFactory("Token");
	// const token = await Token.deploy("Hybrid Test", "HYBRID", "", "");
	// await token.deployed();

	const token = Token.attach("0x11c15f41b25C70ef0D22C5b285434dBd8bc2827D");

	console.log(`Token contract deployed to ${token.address}`);

	// {
	// 	console.log(
	// 		await token
	// 			.connect(accounts[0])
	// 			.adminMintNFT(
	// 				"0xCcA4bDce6dEDc48fDf86Ac68d75435e54e0b342f",
	// 				1,
	// 				20
	// 			)
	// 	);

	// 	console.log(
	// 		await token
	// 			.connect(accounts[0])
	// 			.adminMintNFT(
	// 				"0x4BE2BeB3530c6E6a0B6b6aaCC3a14E7B2a834D07",
	// 				1,
	// 				20
	// 			)
	// 	);
	// }

	// {
	// 	console.log(
	// 		await accounts[0].sendTransaction({
	// 			to: "0xCcA4bDce6dEDc48fDf86Ac68d75435e54e0b342f",
	// 			value: ethers.utils.parseEther("2"),
	// 		})
	// 	);
	// }

	// {
	// 	console.log(
	// 		await accounts[0].sendTransaction({
	// 			to: "0x7Fe49D4e65C1087A1cf129D1Ebd67EBbCb5F1EBd",
	// 			value: ethers.utils.parseEther("2"),
	// 		})
	// 	);
	// }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
