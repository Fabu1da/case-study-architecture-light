 import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
 import { injectable } from 'inversify';
import { SALT_BYTES, HASH_KEY_LENGTH } from '../lib/constant';
 import { promisify } from 'util';

 export interface PasswordManagerService {
     toHash(password: string): Promise<string>;
     compare(storedPassword: string, suppliedPassword: string): Promise<boolean>;
 }

 const scryptAsync = promisify(scrypt);

 /**
  * A utility class to hash user password before storing in DB
  * and compares user supplied passowrd with the stored hash
  */
 @injectable()
 export class PasswordManagerServiceImpl implements PasswordManagerService {
    async toHash(password: string) {
        const salt = randomBytes(SALT_BYTES).toString('hex');
        const hash = (await scryptAsync(password, salt, HASH_KEY_LENGTH)) as Uint8Array;
        return `${salt}:${Buffer.from(hash).toString('hex')}`;
     }

    async compare(storedPassword: string, suppliedPassword: string) {
            const [salt, key] = storedPassword.split(':');
            if (!salt || !key) {
              return false;
            }

            const suppliedHash = (await scryptAsync(suppliedPassword, salt, HASH_KEY_LENGTH)) as Uint8Array;
            const storedHash = new Uint8Array(Buffer.from(key, "hex"));

            if (storedHash.length !== suppliedHash.length) {
              return false;
            }

            return timingSafeEqual(storedHash, suppliedHash);
     }

   
 }
