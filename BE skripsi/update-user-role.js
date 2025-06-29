const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateUserRole() {
  try {
    // Ganti dengan wallet address user yang ingin diubah
    const walletAddress = '0x...'; // Masukkan wallet address user di sini
    
    const updatedUser = await prisma.user.update({
      where: { walletAddress },
      data: { role: 'issuer' }
    });
    
    console.log('User role updated successfully:', updatedUser);
  } catch (error) {
    console.error('Error updating user role:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateUserRole(); 