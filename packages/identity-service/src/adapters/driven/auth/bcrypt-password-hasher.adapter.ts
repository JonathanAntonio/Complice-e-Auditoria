import bcrypt from "bcrypt";
import type { IPasswordHasher } from "../../../application/ports";

export class BcryptPasswordHasher implements IPasswordHasher {
  constructor(private readonly saltRounds: number = 12) {}

  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
