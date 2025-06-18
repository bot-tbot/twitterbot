import { ethers } from 'ethers';
import jwt from 'jsonwebtoken';

import { AuthenticatedRequest } from '../middlewares/authenticate';
import { BadRequestError } from '../controllers/errors';

// Export wallet utilities
export { WalletGenerator, TransactionHelper } from './wallet';

export const verifySignature = (
  message: string,
  signature: string,
  walletAddress: string
): boolean => {
  try {
    // Recover the address from the signature
    const recoveredAddress = ethers.verifyMessage(message, signature);
    return recoveredAddress.toLowerCase() === walletAddress.toLowerCase(); // Compare addresses
  } catch (error) {
    throw new BadRequestError('Failed to verify signature');
  }
};

export const getHeader = (req: AuthenticatedRequest) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return;
  }

  // Extract token from the header
  const token = authHeader.split(' ')[1];
  return token;
};

export const verifyToken = (token: string, secretKey: string) => {
  try {
    const decoded = jwt.verify(token, secretKey);
    return decoded;
  } catch (err) {
    throw new BadRequestError('Failed to verify token');
  }
};
