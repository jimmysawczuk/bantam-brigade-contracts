// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.9;

import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/IERC1155MetadataURI.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";

// import "hardhat/console.sol";

struct Owner {
    address owner;
    uint256 start;
    uint256 amount;
}

abstract contract ERC1155Hybrid is
    Context,
    ERC165,
    IERC1155,
    IERC1155MetadataURI
{
    string internal _name;
    string internal _symbol;
    string internal _uri;
    string internal _contractURI;

    mapping(address => mapping(address => bool)) _operatorApprovals;
    mapping(uint256 => mapping(address => uint256)) _fungibleBalances;
    mapping(uint8 => mapping(uint256 => Owner)) _nftOwnership;
    mapping(uint8 => uint256) _nftMintCounter;
    mapping(uint8 => mapping(address => uint256)) _nftBalances;

    constructor(
        string memory name_,
        string memory symbol_,
        string memory contractURI_,
        string memory uri_
    ) {
        _name = name_;
        _symbol = symbol_;
        _contractURI = contractURI_;
        _uri = uri_;
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC165, IERC165)
        returns (bool)
    {
        return
            interfaceId == type(IERC1155).interfaceId ||
            interfaceId == type(IERC1155MetadataURI).interfaceId ||
            super.supportsInterface(interfaceId);
    }

    function _setMetadata(
        string memory name_,
        string memory symbol_,
        string memory contractURI_,
        string memory uri_
    ) internal {
        _name = name_;
        _symbol = symbol_;
        _contractURI = contractURI_;
        _uri = uri_;
    }

    function ownerOf(uint256 id) public view returns (address) {
        require(!_isFungible(id), "Token ID is fungible");

        uint8 tier = _tierOf(id);

        return _nftOwnership[tier][_findNearestOwnershipRecord(tier, id)].owner;
    }

    function balanceOfTier(address account, uint8 tier)
        public
        view
        returns (uint256)
    {
        return _nftBalances[tier][account];
    }

    function balanceOf(address account, uint256 id)
        public
        view
        returns (uint256)
    {
        if (_isFungible(id)) {
            return _balanceOfFungible(account, id);
        }

        if (ownerOf(id) == account) {
            return 1;
        }

        return 0;
    }

    function _balanceOfFungible(address account, uint256 id)
        private
        view
        returns (uint256)
    {
        return _fungibleBalances[id][account];
    }

    function balanceOfBatch(address[] calldata accounts, uint256[] calldata ids)
        external
        view
        returns (uint256[] calldata)
    {
        require(accounts.length == ids.length, "Array mismatch");

        uint256[] memory res = new uint256[](accounts.length);

        for (uint256 i = 0; i < accounts.length; i++) {
            res[i] = balanceOf(accounts[i], ids[i]);
        }

        return ids;
    }

    function setApprovalForAll(address operator, bool approved) external {
        _setApprovalForAll(_msgSender(), operator, approved);
    }

    function _setApprovalForAll(
        address owner,
        address operator,
        bool approved
    ) internal virtual {
        require(owner != operator, "ERC1155: setting approval status for self");
        _operatorApprovals[owner][operator] = approved;
        emit ApprovalForAll(owner, operator, approved);
    }

    function isApprovedForAll(address account, address operator)
        external
        view
        returns (bool)
    {
        return _operatorApprovals[account][operator];
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes calldata data
    ) external virtual {
        _safeTransferFrom(from, to, id, amount, data);
    }

    function _safeTransferFrom(
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes calldata data
    ) internal {
        if (_isFungible(id)) {
            return _safeTransferFromFungible(from, to, id, amount, data);
        }

        return _safeTransferFromNFT(from, to, id, amount, data);
    }

    function _safeTransferFromFungible(
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) internal virtual {
        require(to != address(0), "ERC1155: transfer to the zero address");

        address operator = _msgSender();

        uint256 fromBalance = _fungibleBalances[id][from];
        require(
            fromBalance >= amount,
            "ERC1155: insufficient balance for transfer"
        );
        unchecked {
            _fungibleBalances[id][from] = fromBalance - amount;
        }
        _fungibleBalances[id][to] += amount;

        emit TransferSingle(operator, from, to, id, amount);

        _doSafeTransferAcceptanceCheck(operator, from, to, id, amount, data);
    }

    function _safeTransferFromNFT(
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) internal {
        address operator = _msgSender();

        require(to != address(0), "ERC1155: transfer to the zero address");
        require(amount == 1, "ERC1155: transfer of NFT must have amount of 1");

        uint8 tier = _tierOf(id);
        Owner storage left = _nftOwnership[tier][
            _findNearestOwnershipRecord(tier, id)
        ];

        require(left.owner == from, "ERC1155: not the owner of this token");
        require(
            from == operator || _operatorApprovals[from][operator],
            "ERC1155: not approved"
        );

        uint256 rightAmount = left.start + left.amount - id - 1;
        uint256 leftAmount = id - left.start;

        // console.log("ownership array length", _nftOwnership[tier].length);
        // console.log("left", left.start, left.amount);
        // console.log("middle", middle.start, middle.amount);
        // console.log("right", right.start, right.amount);

        if (leftAmount > 0) {
            _nftOwnership[tier][left.start].amount = leftAmount;
        }

        _nftOwnership[tier][id] = Owner({owner: to, start: id, amount: 1});

        if (rightAmount > 0) {
            _nftOwnership[tier][id + 1] = Owner({
                owner: from,
                start: id + 1,
                amount: rightAmount
            });
        }

        _nftBalances[tier][from] -= 1;
        _nftBalances[tier][to] += 1;

        emit TransferSingle(operator, from, to, id, amount);

        _doSafeTransferAcceptanceCheck(operator, from, to, id, amount, data);
    }

    function safeBatchTransferFrom(
        address from,
        address to,
        uint256[] calldata ids,
        uint256[] calldata amounts,
        bytes calldata data
    ) external {
        require(ids.length == amounts.length, "Array mismatch");

        for (uint256 i = 0; i < ids.length; i++) {
            _safeTransferFrom(from, to, ids[i], amounts[i], data);
        }
    }

    function _findNearestOwnershipRecord(uint8 tier, uint256 id)
        private
        view
        returns (uint256)
    {
        if (id > _nftMintCounter[tier]) {
            revert("Token not minted");
        }

        for (uint256 i = id; i >= 0; i--) {
            if (_nftOwnership[tier][i].start == i) {
                return _nftOwnership[tier][i].start;
            }
        }

        revert("Ownership could not be determined");
    }

    function name() external view returns (string memory) {
        return _name;
    }

    function symbol() external view returns (string memory) {
        return _symbol;
    }

    function uri(uint256) external view returns (string memory) {
        return _uri;
    }

    function contractURI() public view returns (string memory) {
        return _contractURI;
    }

    function _tierOf(uint256 id) internal view virtual returns (uint8);

    function _isFungible(uint256 id) internal view virtual returns (bool);

    function _isFungibleTier(uint8 tier) internal view virtual returns (bool);

    function _supplyLimit(uint256 id) internal view virtual returns (uint256);

    function _tierBounds(uint8 tier)
        internal
        view
        virtual
        returns (uint256, uint256);

    function _getNextID(uint8 tier) internal view virtual returns (uint256);

    function _incrementNextID(uint8 tier, uint256 amount)
        internal
        virtual
        returns (uint256);

    /**
     * @dev Creates `amount` tokens of token type `id`, and assigns them to `to`.
     *
     * Emits a {TransferSingle} event.
     *
     * Requirements:
     *
     * - `to` cannot be the zero address.
     * - If `to` refers to a smart contract, it must implement {IERC1155Receiver-onERC1155Received} and return the
     * acceptance magic value.
     */
    function _mintFungible(
        address to,
        uint256 id,
        uint256 amount
    ) internal {
        require(to != address(0), "ERC1155: mint to the zero address");

        address operator = _msgSender();

        _fungibleBalances[id][to] += amount;
        emit TransferSingle(operator, address(0), to, id, amount);

        _doSafeTransferAcceptanceCheck(
            operator,
            address(0),
            to,
            id,
            amount,
            "0x"
        );
    }

    /**
     * @dev Destroys `amount` tokens of token type `id` from `from`
     *
     * Emits a {TransferSingle} event.
     *
     * Requirements:
     *
     * - `from` cannot be the zero address.
     * - `from` must have at least `amount` tokens of token type `id`.
     */
    function _burnFungible(
        address from,
        uint256 id,
        uint256 amount
    ) internal {
        require(from != address(0), "ERC1155: burn from the zero address");

        address operator = _msgSender();

        uint256 fromBalance = _fungibleBalances[id][from];
        require(fromBalance >= amount, "ERC1155: burn amount exceeds balance");
        unchecked {
            _fungibleBalances[id][from] = fromBalance - amount;
        }

        emit TransferSingle(operator, from, address(0), id, amount);
    }

    function _mintNFT(
        address to,
        uint8 tier,
        uint256 amount
    ) internal {
        require(to != address(0), "ERC1155: mint to the zero address");

        address operator = _msgSender();
        uint256 start = _incrementNextID(tier, amount);
        address from = address(0);

        _nftOwnership[tier][start] = Owner({
            owner: to,
            start: start,
            amount: amount
        });
        _nftBalances[tier][to] += amount;
        _nftMintCounter[tier] = start + amount - 1;

        emit TransferBatch(
            operator,
            from,
            to,
            _range(start, amount),
            _repeat(1, amount)
        );
    }

    function _doSafeTransferAcceptanceCheck(
        address operator,
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) private {
        if (_isContract(to)) {
            try
                IERC1155Receiver(to).onERC1155Received(
                    operator,
                    from,
                    id,
                    amount,
                    data
                )
            returns (bytes4 response) {
                if (response != IERC1155Receiver.onERC1155Received.selector) {
                    revert("ERC1155: ERC1155Receiver rejected tokens");
                }
            } catch Error(string memory reason) {
                revert(reason);
            } catch {
                revert("ERC1155: transfer to non-ERC1155Receiver implementer");
            }
        }
    }

    function _doSafeBatchTransferAcceptanceCheck(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) private {
        if (_isContract(to)) {
            try
                IERC1155Receiver(to).onERC1155BatchReceived(
                    operator,
                    from,
                    ids,
                    amounts,
                    data
                )
            returns (bytes4 response) {
                if (
                    response != IERC1155Receiver.onERC1155BatchReceived.selector
                ) {
                    revert("ERC1155: ERC1155Receiver rejected tokens");
                }
            } catch Error(string memory reason) {
                revert(reason);
            } catch {
                revert("ERC1155: transfer to non-ERC1155Receiver implementer");
            }
        }
    }

    function _repeat(uint256 value, uint256 length)
        private
        pure
        returns (uint256[] memory)
    {
        uint256[] memory array = new uint256[](length);
        for (uint256 i = 0; i < length; i++) {
            array[i] = value;
        }

        return array;
    }

    function _range(uint256 start, uint256 length)
        private
        pure
        returns (uint256[] memory)
    {
        uint256[] memory array = new uint256[](length);
        for (uint256 i = 0; i < length; i++) {
            array[i] = start + i;
        }

        return array;
    }

    function _isContract(address account) private view returns (bool) {
        // This method relies on extcodesize/address.code.length, which returns 0
        // for contracts in construction, since the code is only stored at the end
        // of the constructor execution.

        return account.code.length > 0;
    }
}
