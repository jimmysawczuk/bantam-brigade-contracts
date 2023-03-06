// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

interface IToken {
    function mintFT(
        address,
        uint256,
        uint256
    ) external;
}

interface IMint {
    function mintCrate(
        address,
        uint256,
        uint256,
        bytes32[] calldata
    ) external;

    function leafUsed(bytes32 leaf) external view returns (bool);

    event TransferSingle(
        address indexed operator,
        address indexed from,
        address indexed to,
        uint256 id,
        uint256 value
    );

    event TransferBatch(
        address indexed operator,
        address indexed from,
        address indexed to,
        uint256[] ids,
        uint256[] values
    );
}

contract Mint is Pausable, Ownable {
    address private _tokenAddress;
    bytes32 private _merkleRoot;
    bool private _enabled;

    mapping(bytes32 => bool) private _usedLeaves;

    function setEnabled(bool b) public onlyOwner {
        _enabled = b;
    }

    function setTokenAddress(address addr) public onlyOwner {
        _tokenAddress = addr;
    }

    function setMerkleRoot(bytes32 merkleRoot_) public onlyOwner {
        _merkleRoot = merkleRoot_;
    }

    function mintCrate(
        address to,
        uint256 tokenID,
        uint256 quantity,
        bytes32[] calldata proof
    ) public whenNotPaused {
        require(_tokenAddress != address(0), "Token address not set.");

        require(_enabled == true, "Minting is not enabled.");

        bytes32 leaf = makeMerkleLeaf(_msgSender(), tokenID, quantity);

        require(
            MerkleProof.verify(proof, _merkleRoot, leaf),
            "Address/quantity combination not on allowlist."
        );

        require(_usedLeaves[leaf] == false, "Mint already used.");

        _usedLeaves[leaf] = true;
        IToken(_tokenAddress).mintFT(to, tokenID, quantity);
    }

    function adminMintCrate(
        address to,
        uint256 tokenID,
        uint256 quantity
    ) public onlyOwner {
        IToken(_tokenAddress).mintFT(to, tokenID, quantity);
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

    function makeMerkleLeaf(
        address wallet,
        uint256 tokenID,
        uint256 quantity
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(wallet, tokenID, quantity));
    }

    function leafUsed(bytes32 leaf) public view returns (bool) {
        return _usedLeaves[leaf];
    }
}
