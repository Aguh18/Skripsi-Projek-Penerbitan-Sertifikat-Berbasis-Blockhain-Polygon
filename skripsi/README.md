# Certificate Registry Smart Contract

Smart contract untuk sistem manajemen sertifikat berbasis blockchain di jaringan Polygon.

## 🚀 Deployment

### Prerequisites

1. **Node.js** (v16 atau lebih baru)
2. **Private Key** dari wallet MetaMask
3. **Testnet MATIC** untuk gas fee

### Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Setup environment variables:**
Buat file `.env` di root folder:
```bash
# Private Key untuk deployment (tanpa 0x di depan)
PRIVATE_KEY=your_private_key_here

# PolygonScan API Key untuk verifikasi contract
POLYGONSCAN_API_KEY=your_polygonscan_api_key_here
```

3. **Compile contracts:**
```bash
npm run compile
```

### Deployment Commands

#### 1. Local Development
```bash
# Start local hardhat node
npm run node

# Deploy ke localhost
npm run deploy:local
```

#### 2. Amoy Testnet (Polygon Testnet)
```bash
# Deploy ke Amoy testnet
npm run deploy:amoy
```

**Network Info:**
- **Chain ID:** 80002
- **RPC URL:** https://rpc-amoy.polygon.technology
- **Explorer:** https://www.oklink.com/amoy
- **Faucet:** https://faucet.polygon.technology/ (pilih Amoy)

#### 3. Polygon Mainnet
```bash
# Deploy ke Polygon mainnet
npm run deploy:polygon
```

**Network Info:**
- **Chain ID:** 137
- **RPC URL:** https://polygon-rpc.com
- **Explorer:** https://polygonscan.com

### Mendapatkan Testnet MATIC

1. Kunjungi [Polygon Faucet](https://faucet.polygon.technology/)
2. Pilih "Amoy Testnet"
3. Masukkan wallet address Anda
4. Claim testnet MATIC

### Mendapatkan PolygonScan API Key

1. Daftar di [PolygonScan](https://polygonscan.com/)
2. Buka [API Keys](https://polygonscan.com/apis)
3. Buat API key baru

### Contract Verification

Setelah deployment, contract akan otomatis diverifikasi di explorer. Jika gagal, Anda bisa verifikasi manual:

**Amoy Testnet:**
- Kunjungi: https://www.oklink.com/amoy/verify
- Masukkan contract address
- Upload source code

**Polygon Mainnet:**
- Kunjungi: https://polygonscan.com/verifyContract
- Masukkan contract address
- Upload source code

## 📋 Contract Functions

### Admin Functions
- `addIssuer(address _issuer)` - Tambah issuer baru
- `removeIssuer(address _issuer)` - Hapus issuer
- `isIssuer(address _address)` - Cek apakah address adalah issuer

### Issuer Functions
- `issueCertificate(...)` - Terbitkan sertifikat baru
- `issueCertificatesBulk(...)` - Terbitkan sertifikat secara bulk
- `revokeCertificate(string _id)` - Batalkan sertifikat

### Public Functions
- `verifyCertificate(string _id)` - Verifikasi sertifikat
- `getCertificate(string _id)` - Ambil data sertifikat

## 🔧 Development

### Testing
```bash
npm test
```

### Clean Build
```bash
npm run clean
npm run compile
```

## 📁 Project Structure

```
skripsi/
├── contracts/
│   └── CertificateRegistry.sol
├── scripts/
│   ├── deploy.js
│   ├── deploy-amoy.js
│   └── deploy-polygon.js
├── test/
├── hardhat.config.js
└── package.json
```

## ⚠️ Important Notes

- **Private Key:** Jangan pernah commit private key ke repository
- **Gas Fee:** Pastikan wallet memiliki MATIC yang cukup
- **Testnet First:** Selalu test di testnet sebelum mainnet
- **Backup:** Simpan deployment info yang dihasilkan

## 📞 Support

Jika ada masalah dengan deployment, cek:
1. Private key valid
2. MATIC balance cukup
3. Network configuration benar
4. Gas price sesuai
