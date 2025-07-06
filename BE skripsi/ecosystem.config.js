module.exports = {
    apps: [{
        name: "certchain-backend",
        script: "src/index.js",
        cwd: "/home/aguhh18/Documents/Skripsi-Projek-Penerbitan-Sertifikat-Berbasis-Blockhain-Polygon/BE skripsi",
        env: {
            NODE_ENV: "production"
        },
        env_file: ".env"
    }]
} 