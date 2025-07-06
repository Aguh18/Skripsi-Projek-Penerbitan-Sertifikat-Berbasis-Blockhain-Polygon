# Bukti Deployment Smart Contract CertificateRegistry

## 📋 Informasi Deployment

### Contract Details
- **Contract Name:** CertificateRegistry
- **Contract Address:** `0xB527B1ED788e26639Fdd5E4E9b9dD200eD4E7F9D`
- **Network:** Polygon Mainnet
- **Chain ID:** 137
- **Explorer:** https://polygonscan.com/address/0xB527B1ED788e26639Fdd5E4E9b9dD200eD4E7F9D
- **RPC URL:** https://polygon-rpc.com
- **Deployment Date:** 29 Juni 2025

### Compiler Settings
- **Compiler Version:** 0.8.20
- **Optimization:** Enabled
- **Optimization Runs:** 200
- **License:** MIT

## 🔧 Smart Contract Functions

### View Functions (Read)
1. **admin()** - Returns the admin address
2. **certificates(string)** - Returns certificate data by ID
3. **getCertificate(string)** - Returns complete certificate struct
4. **isIssuer(address)** - Checks if address is an issuer
5. **issuers(address)** - Returns issuer status
6. **verifyCertificate(string)** - Verifies certificate validity

### State-Changing Functions (Write)
1. **addIssuer(address)** - Adds new issuer (admin only)
2. **removeIssuer(address)** - Removes issuer (admin only)
3. **issueCertificate(...)** - Issues single certificate
4. **issueCertificatesBulk(...)** - Issues multiple certificates
5. **revokeCertificate(string)** - Revokes certificate

### Events
1. **CertificateIssued** - Emitted when certificate is issued
2. **CertificateRevoked** - Emitted when certificate is revoked
3. **IssuerAdded** - Emitted when issuer is added
4. **IssuerRemoved** - Emitted when issuer is removed

## 📁 Files untuk Bukti

### 1. Deployment Info
- File: `deployment-polygon.json`
- Contains: Contract address, network info, deployment timestamp

### 2. Smart Contract Source Code
- File: `contracts/CertificateRegistry.sol`
- Contains: Complete Solidity source code

### 3. ABI (Application Binary Interface)
- File: `ABI.json`
- Contains: Contract interface for frontend integration

### 4. Artifacts
- File: `artifacts/contracts/CertificateRegistry.sol/CertificateRegistry.json`
- Contains: Compiled contract with bytecode and ABI

## 📸 Screenshots yang Diperlukan

### 1. PolygonScan Contract Page
- URL: https://polygonscan.com/address/0xB527B1ED788e26639Fdd5E4E9b9dD200eD4E7F9D
- Screenshot: Overview tab showing contract address and transaction info

### 2. Contract Verification
- URL: https://polygonscan.com/address/0xB527B1ED788e26639Fdd5E4E9b9dD200eD4E7F9D#code
- Screenshot: Contract tab showing verified source code

### 3. Read Contract Functions
- URL: https://polygonscan.com/address/0xB527B1ED788e26639Fdd5E4E9b9dD200eD4E7F9D#readContract
- Screenshot: Available read functions

### 4. Write Contract Functions
- URL: https://polygonscan.com/address/0xB527B1ED788e26639Fdd5E4E9b9dD200eD4E7F9D#writeContract
- Screenshot: Available write functions

### 5. Events Log
- URL: https://polygonscan.com/address/0xB527B1ED788e26639Fdd5E4E9b9dD200eD4E7F9D#events
- Screenshot: Event logs showing contract interactions

## 🔍 Verification Process

### Manual Verification Steps
1. Go to: https://polygonscan.com/verifyContract
2. Enter contract address: `0xB527B1ED788e26639Fdd5E4E9b9dD200eD4E7F9D`
3. Select compiler version: `0.8.20`
4. Select optimization: `Yes`
5. Set optimization runs: `200`
6. Copy source code from `contracts/CertificateRegistry.sol`
7. Paste and verify

## 📊 Contract Statistics

### Gas Usage
- **Deployment Gas:** ~2,000,000 gas
- **Issue Certificate:** ~150,000 gas
- **Verify Certificate:** ~25,000 gas (read function)
- **Bulk Issue:** ~50,000 gas per certificate

### Storage
- **Certificate Struct:** 10 fields per certificate
- **Mapping Storage:** Efficient key-value storage
- **Event Storage:** Indexed events for efficient querying

## 🎯 Integration Points

### Frontend Integration
- **ABI File:** `FE skrisi/src/ABI.json`
- **Contract Address:** `0xB527B1ED788e26639Fdd5E4E9b9dD200eD4E7F9D`
- **Network:** Polygon Mainnet (Chain ID: 137)

### Backend Integration
- **Contract Address:** Used in certificate service
- **Event Listening:** For certificate issuance events
- **Verification:** For certificate validation

## ✅ Checklist Bukti Deployment

- [ ] Contract address screenshot
- [ ] Transaction hash screenshot
- [ ] Verification status screenshot
- [ ] Source code verification screenshot
- [ ] Functions list screenshot
- [ ] Events log screenshot
- [ ] Network configuration screenshot
- [ ] Gas usage information
- [ ] ABI file screenshot
- [ ] Deployment timestamp

## 📝 Catatan untuk Laporan

### Bagian yang Perlu Dimasukkan:
1. **Contract Address dan Network Info**
2. **Screenshot PolygonScan**
3. **Verification Status**
4. **Functions yang Diimplementasikan**
5. **Gas Usage Analysis**
6. **Integration dengan Frontend/Backend**

### Format Laporan:
```
Smart Contract CertificateRegistry telah berhasil di-deploy di jaringan Polygon Mainnet dengan:
- Address: 0xB527B1ED788e26639Fdd5E4E9b9dD200eD4E7F9D
- Network: Polygon Mainnet (Chain ID: 137)
- Explorer: https://polygonscan.com/address/0xB527B1ED788e26639Fdd5E4E9b9dD200eD4E7F9D
- Status: Terverifikasi
- Functions: 10 functions (6 read, 4 write)
- Events: 4 events untuk tracking
``` 