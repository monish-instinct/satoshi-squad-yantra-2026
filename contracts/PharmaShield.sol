// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract PharmaShield {
    struct Batch {
        string batchId;
        address currentOwner;
        string ipfsHash;
        uint256 createdAt;
        bool exists;
    }

    mapping(string => Batch) public batches;
    mapping(address => bool) public manufacturers;

    event BatchRegistered(
        string indexed batchId,
        address indexed owner,
        string ipfsHash,
        uint256 timestamp
    );

    event OwnershipTransferred(
        string indexed batchId,
        address indexed from,
        address indexed to,
        uint256 timestamp
    );

    event BatchVerified(
        string indexed batchId,
        address indexed verifier,
        uint256 timestamp
    );

    modifier onlyBatchOwner(string calldata batchId) {
        require(batches[batchId].exists, "Batch does not exist");
        require(batches[batchId].currentOwner == msg.sender, "Not the batch owner");
        _;
    }

    function registerBatch(
        string calldata batchId,
        string calldata ipfsHash
    ) external {
        require(!batches[batchId].exists, "Batch already registered");
        require(bytes(ipfsHash).length > 0, "IPFS hash required");

        batches[batchId] = Batch({
            batchId: batchId,
            currentOwner: msg.sender,
            ipfsHash: ipfsHash,
            createdAt: block.timestamp,
            exists: true
        });

        emit BatchRegistered(batchId, msg.sender, ipfsHash, block.timestamp);
    }

    function verifyBatch(string calldata batchId)
        external
        returns (
            bool exists,
            address currentOwner,
            string memory ipfsHash,
            uint256 createdAt
        )
    {
        Batch memory batch = batches[batchId];

        if (batch.exists) {
            emit BatchVerified(batchId, msg.sender, block.timestamp);
        }

        return (
            batch.exists,
            batch.currentOwner,
            batch.ipfsHash,
            batch.createdAt
        );
    }

    function transferOwnership(
        string calldata batchId,
        address newOwner
    ) external onlyBatchOwner(batchId) {
        require(newOwner != address(0), "Invalid new owner");
        require(newOwner != msg.sender, "Already the owner");

        address previousOwner = batches[batchId].currentOwner;
        batches[batchId].currentOwner = newOwner;

        emit OwnershipTransferred(batchId, previousOwner, newOwner, block.timestamp);
    }

    function getBatchOwner(string calldata batchId) external view returns (address) {
        require(batches[batchId].exists, "Batch does not exist");
        return batches[batchId].currentOwner;
    }
}
