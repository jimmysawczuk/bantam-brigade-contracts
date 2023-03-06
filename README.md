# bantam-brigade-contracts

> ℹ **TL;DR:** a new implementation of an ERC-1155 contract that allows for ranges of non-fungible and fungible tokens and provides gas savings on minting multiple non-fungible tokens similar to ERC721A.

This repository contains three implementation contracts and one interface contract. The `Burn` and `Mint` contracts are fairly standard and are meant to be quick to produce/deploy/swap.

The more noteworthy contracts in this repo are the `ERC1155Hybrid` and `Token` contracts. `ERC1155Hybrid` provides an ERC1155 token with the ability to define token ID ranges that are either fungible or nonfungible. In the fungible ranges, a fairly standard ERC1155 is implemented, but in the non-fungible ranges, a simplified version of ERC721A is implemented, providing gas savings (especially for multiple mints) at mint time.

`Token` is an implementer of the `ERC1155Hybrid` contract and defines token ranges are used for the Bantam Brigade product. A lot of this implementation is intentionally hard-coded to save gas; the idea is that future implementers will implement their own `Token` contract based on `ERC1155Hybrid` to suit their needs.

Things to look for:

1. Any security flaws or potential vulnerabilities
2. Any edge case that would produce an incorrect representation of fungible or non-fungible token ownership
3. Any opportunities for gas savings during mint or transfer
