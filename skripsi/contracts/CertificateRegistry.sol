// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract CertificateRegistry {
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

    // Modifier untuk memastikan hanya issuer yang bisa memanggil fungsi
    modifier onlyIssuer(string memory _id) {
        require(
            certificates[_id].issuerAddress == msg.sender,
            "Only issuer can perform this action"
        );
        _;
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
    ) external returns (string memory) {
        // Pastikan ID tidak kosong
        require(bytes(_id).length > 0, "ID cannot be empty");
        // Pastikan ID belum digunakan
        require(bytes(certificates[_id].id).length == 0, "ID already exists");

        certificates[_id] = Certificate({
            id: _id,
            certificateTitle: _certificateTitle,
            expiryDate: _expiryDate,
            issueDate: _issueDate,
            cid : _cid,
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

    // Fungsi untuk membatalkan sertifikat (hanya issuer)
    function revokeCertificate(string memory _id) external onlyIssuer(_id) {
        require(certificates[_id].isValid, "Certificate already revoked or invalid");
        certificates[_id].isValid = false;
        emit CertificateRevoked(_id);
    }
}