# Polygon Network Performance Test Scripts

Folder ini berisi script pengujian kinerja jaringan Polygon (testnet Amoy).

## Persiapan
1. Install dependencies:
   ```bash
   npm install ethers
   ```
2. Ganti `PRIVATE_KEY_KAMU` di setiap script dengan private key wallet testnet kamu (jangan gunakan wallet utama!).

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