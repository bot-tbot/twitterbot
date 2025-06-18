import { Document, model, Schema, Types } from 'mongoose';

export interface IUserDetail {
  id?: string;
  userName: string;
  walletAddress: string;
  jwt: string;
  createdAt: Date;
  updatedAt: Date;
  twitterId: string;
  twitterScreenName: string;
  twitterVerified: boolean;
  twitchId: string;
  twitchUsername: string;
  twitchVerified: boolean;
  totalTweets: number;
  twitterFollowers: number;
  twitterAccountAgeInDay: string;
  referralCode: string;
  referralCount: number;
  referredBy: string;
  referrerCode: string;
  karma: number;
  lastKarmaUpdate: Date;
  finalScore: number;
  twitterProfileImageUrl: string;
  referredAt: number;
  isBot?: boolean;
}

export const UserDetailsSchema = new Schema(
  {
    userName: { type: String, unique: true },
    walletAddress: { type: String, unique: true, index: true },
    jwt: { type: String },

    twitterId: { type: String, sparse: true },
    twitterFollowers: { type: Number, default: -1 },
    totalTweets: { type: Number, default: -1 },
    twitterAccountAgeInDay: { type: String, default: '-1' },
    twitterScreenName: { type: String, sparse: true },
    twitterVerified: { type: Boolean, default: false },

    twitchId: { type: String, sparse: true },
    twitchUsername: { type: String, sparse: true },
    twitchVerified: { type: Boolean, default: false },
    referralCode: { type: String, unique: true, required: false },
    referralCount: { type: Number, default: 0 },
    referredBy: { type: String, ref: 'Users' }, // walletAddress
    referrerCode: { type: String },
    karma: { type: Number, default: 0 },
    lastKarmaUpdate: { type: Date, sparse: true },
    finalScore: { type: Number, default: 0 },
    twitterProfileImageUrl: { type: String },
    isBot: { type: Boolean, default: false, select: false },
    referredAt: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export type IUserModel = IUserDetail & Document;
export const Users = model<IUserModel>('User', UserDetailsSchema);
