// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract CertificateRegistry {
    address public admin;
    mapping(address => bool) public issuers;

    // Struktur data untuk sertifikat
    struct Certificate {
        string id;
        string certificateTitle;
        string cid;
        string expiryDate;
        string issueDate;
        address issuerAddress;
        string issuerName;
        string recipientName;
        address targetAddress;
        bool isValid;
    }

    // Mapping untuk menyimpan sertifikat berdasarkan ID (string)
    mapping(string => Certificate) public certificates;

    // Event untuk mencatat penerbitan sertifikat
    event CertificateIssued(
        string indexed id,
        address indexed issuerAddress,
        address indexed targetAddress,
        string recipientName,
        string issueDate
    );

    // Event untuk mencatat pembatalan sertifikat
    event CertificateRevoked(string indexed id);
    event IssuerAdded(address indexed issuer);
    event IssuerRemoved(address indexed issuer);

    // Modifier untuk memastikan hanya admin yang bisa memanggil fungsi
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    // Modifier untuk memastikan hanya issuer yang bisa memanggil fungsi
    modifier onlyIssuer() {
        require(issuers[msg.sender] || msg.sender == admin, "Only issuer or admin can perform this action");
        _;
    }

    // Modifier untuk memastikan hanya issuer atau admin yang bisa memanggil fungsi
    modifier onlyIssuerOrAdmin(string memory _id) {
        require(
            certificates[_id].issuerAddress == msg.sender || msg.sender == admin,
            "Only issuer or admin can perform this action"
        );
        _;
    }

    constructor() {
        admin = msg.sender;
        issuers[msg.sender] = true; // Admin is also an issuer by default
    }

    function addIssuer(address _issuer) external onlyAdmin {
        require(_issuer != address(0), "Invalid address");
        require(!issuers[_issuer], "Address is already an issuer");
        
        issuers[_issuer] = true;
        emit IssuerAdded(_issuer);
    }

    function removeIssuer(address _issuer) external onlyAdmin {
        require(_issuer != admin, "Cannot remove admin as issuer");
        require(issuers[_issuer], "Address is not an issuer");
        
        issuers[_issuer] = false;
        emit IssuerRemoved(_issuer);
    }

    function isIssuer(address _address) external view returns (bool) {
        return issuers[_address] || _address == admin;
    }

    // Fungsi untuk menerbitkan sertifikat baru
    function issueCertificate(
        string memory _id,
        string memory _certificateTitle,
        string memory _expiryDate,
        string memory _issueDate,
        string memory _cid,
        string memory _issuerName,
        string memory _recipientName,
        address _targetAddress
    ) external onlyIssuer returns (string memory) {
        // Pastikan ID tidak kosong
        require(bytes(_id).length > 0, "ID cannot be empty");
        // Pastikan ID belum digunakan
        require(bytes(certificates[_id].id).length == 0, "ID already exists");

        certificates[_id] = Certificate({
            id: _id,
            certificateTitle: _certificateTitle,
            expiryDate: _expiryDate,
            issueDate: _issueDate,
            cid: _cid,
            issuerAddress: msg.sender,
            issuerName: _issuerName,
            recipientName: _recipientName,
            targetAddress: _targetAddress,
            isValid: true
        });

        emit CertificateIssued(
            _id,
            msg.sender,
            _targetAddress,
            _recipientName,
            _issueDate
        );

        return _id;
    }

    // Fungsi untuk memverifikasi sertifikat berdasarkan ID
    function verifyCertificate(string memory _id) external view returns (bool) {
        return certificates[_id].isValid && bytes(certificates[_id].id).length != 0;
    }

    // Fungsi untuk mengambil data sertifikat berdasarkan ID
    function getCertificate(string memory _id) external view returns (Certificate memory) {
        require(bytes(certificates[_id].id).length != 0, "Certificate does not exist");
        return certificates[_id];
    }

    // Fungsi untuk membatalkan sertifikat (hanya issuer atau admin)
    function revokeCertificate(string memory _id) external onlyIssuerOrAdmin(_id) {
        require(certificates[_id].isValid, "Certificate already revoked or invalid");
        certificates[_id].isValid = false;
        emit CertificateRevoked(_id);
    }

    function issueCertificatesBulk(
        string[] memory _ids,
        string[] memory _certificateTitles,
        string[] memory _expiryDates,
        string[] memory _issueDates,
        string[] memory _cids,
        string[] memory _issuerNames,
        string[] memory _recipientNames,
        address[] memory _targetAddresses
    ) external onlyIssuer {
        require(
            _ids.length == _certificateTitles.length &&
            _ids.length == _expiryDates.length &&
            _ids.length == _issueDates.length &&
            _ids.length == _cids.length &&
            _ids.length == _issuerNames.length &&
            _ids.length == _recipientNames.length &&
            _ids.length == _targetAddresses.length,
            "Array length mismatch"
        );
        for (uint i = 0; i < _ids.length; i++) {
            require(bytes(_ids[i]).length > 0, "ID cannot be empty");
            require(bytes(certificates[_ids[i]].id).length == 0, "ID already exists");
            certificates[_ids[i]] = Certificate({
                id: _ids[i],
                certificateTitle: _certificateTitles[i],
                expiryDate: _expiryDates[i],
                issueDate: _issueDates[i],
                cid: _cids[i],
                issuerAddress: msg.sender,
                issuerName: _issuerNames[i],
                recipientName: _recipientNames[i],
                targetAddress: _targetAddresses[i],
                isValid: true
            });
            emit CertificateIssued(
                _ids[i],
                msg.sender,
                _targetAddresses[i],
                _recipientNames[i],
                _issueDates[i]
            );
        }
    }
} 