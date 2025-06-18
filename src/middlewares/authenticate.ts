import { NextFunction, Request, Response } from 'express';
import nconf from 'nconf';
import { getHeader, verifyToken } from '../utils';
import { Users } from '../database/user';
import { IUserModel } from '../database/user';
import { NotAuthorizedError } from '../controllers/errors';

export interface AuthenticatedRequest extends Request {
  user: IUserModel;
}

export const authenticate = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) => {
  const token = getHeader(req);
  if (!token) throw new NotAuthorizedError('No token provided');

  const decoded = verifyToken(token, nconf.get('SECRET_KEY')) as {
    userId: string;
    iat: number;
    exp: number;
  };

  if (Date.now() > decoded.exp * 1000) throw new NotAuthorizedError('Token expired');
  console.log(decoded.userId)
  const user = await Users.findById(decoded.userId);
  console.log(user)
  if (!user) throw new NotAuthorizedError('Invalid token');

  req.user = user;
  next();
};
