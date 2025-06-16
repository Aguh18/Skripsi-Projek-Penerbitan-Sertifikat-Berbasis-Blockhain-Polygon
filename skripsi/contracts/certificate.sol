// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Certificate {
    struct CertificateData {
        string certificateId;
        string issuerAddress;
        string recipientAddress;
        uint256 issueDate;
        uint256 expiryDate;
        string ipfsHash;
        bool isValid;
    }

    mapping(string => CertificateData) public certificates;
    mapping(address => string[]) public issuerCertificates;
    mapping(address => string[]) public recipientCertificates;

    event CertificateIssued(
        string certificateId,
        string issuerAddress,
        string recipientAddress,
        uint256 issueDate,
        uint256 expiryDate,
        string ipfsHash
    );

    event CertificateBulkIssued(
        string[] certificateIds,
        string issuerAddress,
        string[] recipientAddresses,
        uint256[] issueDates,
        uint256[] expiryDates,
        string[] ipfsHashes
    );

    function issueCertificate(
        string memory _certificateId,
        string memory _recipientAddress,
        uint256 _issueDate,
        uint256 _expiryDate,
        string memory _ipfsHash
    ) public {
        require(certificates[_certificateId].isValid == false, "Certificate already exists");
        
        certificates[_certificateId] = CertificateData({
            certificateId: _certificateId,
            issuerAddress: toAsciiString(msg.sender),
            recipientAddress: _recipientAddress,
            issueDate: _issueDate,
            expiryDate: _expiryDate,
            ipfsHash: _ipfsHash,
            isValid: true
        });

        issuerCertificates[msg.sender].push(_certificateId);
        recipientCertificates[toAddress(_recipientAddress)].push(_certificateId);

        emit CertificateIssued(
            _certificateId,
            toAsciiString(msg.sender),
            _recipientAddress,
            _issueDate,
            _expiryDate,
            _ipfsHash
        );
    }

    function bulkIssueCertificates(
        string[] memory _certificateIds,
        string[] memory _recipientAddresses,
        uint256[] memory _issueDates,
        uint256[] memory _expiryDates,
        string[] memory _ipfsHashes
    ) public {
        require(
            _certificateIds.length == _recipientAddresses.length &&
            _certificateIds.length == _issueDates.length &&
            _certificateIds.length == _expiryDates.length &&
            _certificateIds.length == _ipfsHashes.length,
            "Array lengths must match"
        );

        for (uint i = 0; i < _certificateIds.length; i++) {
            require(certificates[_certificateIds[i]].isValid == false, "Certificate already exists");
            
            certificates[_certificateIds[i]] = CertificateData({
                certificateId: _certificateIds[i],
                issuerAddress: toAsciiString(msg.sender),
                recipientAddress: _recipientAddresses[i],
                issueDate: _issueDates[i],
                expiryDate: _expiryDates[i],
                ipfsHash: _ipfsHashes[i],
                isValid: true
            });

            issuerCertificates[msg.sender].push(_certificateIds[i]);
            recipientCertificates[toAddress(_recipientAddresses[i])].push(_certificateIds[i]);
        }

        emit CertificateBulkIssued(
            _certificateIds,
            toAsciiString(msg.sender),
            _recipientAddresses,
            _issueDates,
            _expiryDates,
            _ipfsHashes
        );
    }

    // Helper functions
    function toAsciiString(address x) internal pure returns (string memory) {
        bytes memory s = new bytes(40);
        for (uint i = 0; i < 20; i++) {
            bytes1 b = bytes1(uint8(uint(uint160(x)) / (2**(8*(19 - i)))));
            bytes1 hi = bytes1(uint8(b) / 16);
            bytes1 lo = bytes1(uint8(b) - 16 * uint8(hi));
            s[2*i] = char(hi);
            s[2*i+1] = char(lo);            
        }
        return string(s);
    }

    function toAddress(string memory _address) internal pure returns (address) {
        bytes memory b = bytes(_address);
        uint result = 0;
        for (uint i = 0; i < b.length; i++) {
            uint c = uint(uint8(b[i]));
            if (c >= 48 && c <= 57) {
                result = result * 16 + (c - 48);
            }
            if (c >= 97 && c <= 102) {
                result = result * 16 + (c - 97 + 10);
            }
            if (c >= 65 && c <= 70) {
                result = result * 16 + (c - 65 + 10);
            }
        }
        return address(uint160(result));
    }

    function char(bytes1 b) internal pure returns (bytes1 c) {
        if (uint8(b) < 10) return bytes1(uint8(b) + 0x30);
        else return bytes1(uint8(b) + 0x57);
    }
}
