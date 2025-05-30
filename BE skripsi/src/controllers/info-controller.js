const { promises: fs } = require('fs');
const path = require('path');
const { StatusCodes } = require("http-status-codes");
const Web3StorageClient = require('../config/storage');



const info = async (req, res) => {
  try {
    const web3Client = Web3StorageClient.getInstance();
    await web3Client.initialize();

    const filePath = path.join(__dirname, 'test.txt');

    try {
      await fs.access(filePath);
      console.log('✅ File exists:', filePath);
    } catch (error) {
      console.error('❌ File not found:', filePath);
      throw new Error(`File ${filePath} tidak ditemukan`);
    }



    const fileContent = await fs.readFile(filePath);
    const fileName = path.basename(filePath);
    const file = new File([fileContent], fileName, { type: 'text/plain' });



    const cid = await web3Client.uploadFile(file);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "File uploaded successfully",
      data: { cid },
    });
  } catch (error) {
    console.error('Error:', error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to process request",
      error: error.message,
    });
  }
};

module.exports = { info };