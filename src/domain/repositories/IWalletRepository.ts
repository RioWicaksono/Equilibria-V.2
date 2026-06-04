import { Wallet } from '../entities/Wallet';

export interface IWalletRepository {
  save(wallet: Wallet): Promise<void>;
  findAll(): Promise<Wallet[]>;
  findById(id: string): Promise<Wallet | null>;
  delete(id: string): Promise<void>;
}