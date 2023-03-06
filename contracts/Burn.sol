// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// import "hardhat/console.sol";

interface IToken {
    function burnFT(
        address,
        uint256,
        uint256
    ) external;

    function mintNFT(
        address to,
        uint8 tier,
        uint256 quantity
    ) external;
}

struct TokenMap {
    bool present;
    uint8 tier;
    uint256 quantity;
}

contract Burn is Pausable, Ownable {
    address private _tokenAddress;

    mapping(uint256 => TokenMap) _tokenToTier;

    constructor() {
        _tokenToTier[0] = TokenMap(true, 1, 20);
        _tokenToTier[1] = TokenMap(true, 1, 5);
        _tokenToTier[2] = TokenMap(true, 2, 20);
    }

    function setTokenAddress(address addr) public onlyOwner {
        _tokenAddress = addr;
    }

    function breakCrate(
        address to,
        uint256 token,
        uint256 quantity,
        bytes calldata signature
    ) public {
        require(_tokenToTier[token].present, "Token not configured.");

        // console.log("burning FTs", token, quantity);

        IToken(_tokenAddress).burnFT(msg.sender, token, quantity);

        // console.log(
        //     "minting NFTs",
        //     _tokenToTier[token].tier,
        //     _tokenToTier[token].quantity * quantity
        // );

        IToken(_tokenAddress).mintNFT(
            to,
            _tokenToTier[token].tier,
            _tokenToTier[token].quantity * quantity
        );

        // console.log("done with break");
    }

    function setPaused(bool b) public onlyOwner {
        if (b) {
            require(b && !paused(), "Contract is already paused");
            _pause();
            return;
        }

        require(!b && paused(), "Contract is not paused");
        _unpause();
    }
}
