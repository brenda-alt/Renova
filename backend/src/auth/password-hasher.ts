import { Injectable } from '@nestjs/common';
import { compare, hash } from 'bcrypt';

@Injectable()
export class PasswordHasher {
  hash(senha: string): Promise<string> {
    return hash(senha, 12);
  }

  compare(senha: string, senhaHash: string): Promise<boolean> {
    return compare(senha, senhaHash);
  }
}
