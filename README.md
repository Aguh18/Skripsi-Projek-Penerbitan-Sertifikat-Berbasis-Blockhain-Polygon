# Skripsi - Blockchain-based Certificate Management System

## Overview
This project implements a decentralized certificate management system using blockchain technology. It consists of three main components: a Smart Contract for certificate management, a Backend API service, and a Frontend web application.

## Project Structure
```
├── BE skripsi/           # Backend API Service
├── FE skrisi/           # Frontend Web Application
└── skripsi/             # Smart Contract & Blockchain
```

## Components

### 1. Smart Contract (skripsi/)
The smart contract handles the core certificate management functionality on the blockchain:
- Certificate issuance
- Certificate verification
- Certificate revocation
- Ownership management

### 2. Backend Service (BE skripsi/)
Node.js/Express backend that provides:
- RESTful API endpoints
- Database management
- Integration with blockchain
- File storage for certificates
- Authentication and authorization

### 3. Frontend Application (FE skrisi/)
React-based web application featuring:
- User authentication
- Certificate submission
- Certificate verification
- Certificate management dashboard
- MetaMask integration for blockchain interactions

## Prerequisites
- Node.js (v14 or higher)
- MetaMask browser extension
- Hardhat (for local blockchain development)
- MongoDB
- Git

## Setup Instructions

### 1. Smart Contract Setup
```bash
cd skripsi
npm install
npx hardhat compile
npx hardhat node
```

### 2. Backend Setup
```bash
cd BE skripsi
npm install
# Configure .env file
npm run dev
```

### 3. Frontend Setup
```bash
cd FE skrisi
npm install
# Configure .env file
npm start
```

## Environment Variables

### Backend (.env)
```
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000
REACT_APP_CONTRACT_ADDRESS=your_contract_address
```

## Features

### Certificate Management
- Submit new certificates
- Verify certificate authenticity
- Revoke certificates
- View certificate history

### Blockchain Integration
- MetaMask wallet connection
- Smart contract interaction
- Transaction management
- Gas fee handling

### Security Features
- JWT authentication
- Role-based access control
- Blockchain verification
- Secure file storage

## API Endpoints

### Authentication
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/verify

### Certificates
- POST /api/certificates
- GET /api/certificates
- GET /api/certificates/:id
- PUT /api/certificates/:id
- DELETE /api/certificates/:id

## Contributing
1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License
This project is licensed under the MIT License - see the LICENSE file for details.

## Contact
For any questions or concerns, please open an issue in the repository. 