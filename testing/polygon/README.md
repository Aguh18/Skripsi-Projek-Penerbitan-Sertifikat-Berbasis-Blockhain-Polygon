# Polygon Network Performance Test Scripts

Folder ini berisi script pengujian kinerja jaringan Polygon (testnet Amoy/mainnet) menggunakan private key yang sama dengan deploy smart contract.

## Persiapan
1. Copy file `.env.example` menjadi `.env` dan isi dengan private key wallet deploy kamu:
   ```bash
   cp .env.example .env
   # Edit .env dan isi PRIVATE_KEY
   ```
2. Install dependencies:
   ```bash
   npm install ethers dotenv
   ```

## Daftar Script
- `test-confirmation-gas.js`  
  Mengukur waktu konfirmasi dan biaya gas satu transaksi.
- `test-batch.js`  
  Mengukur success rate, throughput, dan rata-rata waktu konfirmasi untuk banyak transaksi paralel.
- `monitor-node.js`  
  Mengecek block height dan latency RPC node Polygon.

## Cara Menjalankan

```bash
node test-confirmation-gas.js
node test-batch.js
node monitor-node.js
```

## Catatan
- Gunakan testnet (Amoy) untuk pengujian.
- Simpan hasil output untuk dokumentasi.
- Untuk pengujian variasi waktu, jalankan script di waktu berbeda (pagi, siang, malam).
- Untuk pengujian ping RPC, gunakan:
  ```bash
  curl -w "%{time_total}\n" -o /dev/null -s https://rpc-amoy.polygon.technology
  ``` 