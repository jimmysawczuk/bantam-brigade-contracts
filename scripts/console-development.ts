const Token = await ethers.getContractFactory("Token");
const token = await Token.attach("0x06E535235d90CE04ab7b74FbcF24edB403562584");

const Mint = await ethers.getContractFactory("Mint");
const mint = await Mint.attach("0x85465f56c0831097a630c809Cbae4fD8F7D3364C");
