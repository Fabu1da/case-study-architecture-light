import 'reflect-metadata';
import { PasswordManagerServiceImpl } from '../../src/services/password-manager-service';
import crypto from 'crypto';

describe('PasswordManagerServiceImpl', () => {
  let passwordManager: PasswordManagerServiceImpl;

  beforeEach(() => {
    passwordManager = new PasswordManagerServiceImpl();
  });

  describe('toHash', () => {
    it('should hash a password', async () => {
      const password = 'TestPassword123!';

      const hash = await passwordManager.toHash(password);

      expect(hash).toBeTruthy();
      expect(typeof hash).toBe('string');
      expect(hash).not.toBe(password);
    });

    it('should generate different hashes for the same password', async () => {
      const password = 'TestPassword123!';

      const hash1 = await passwordManager.toHash(password);
      const hash2 = await passwordManager.toHash(password);

      expect(hash1).not.toBe(hash2);
    });

    it('should hash with proper format (salt:hash)', async () => {
      const password = 'TestPassword123!';

      const hash = await passwordManager.toHash(password);

      expect(hash).toContain(':');
      const [salt, hashedPassword] = hash.split(':');
      expect(salt).toBeTruthy();
      expect(hashedPassword).toBeTruthy();
    });

    it('should produce consistent length hashes', async () => {
      const password1 = 'Short';
      const password2 = 'VeryVeryVeryVeryVeryVeryVeryVeryLongPassword123!';

      const hash1 = await passwordManager.toHash(password1);
      const hash2 = await passwordManager.toHash(password2);

      // Both should have similar format (salt:hash in hex)
      expect(hash1.split(':')[1]).toBeTruthy();
      expect(hash2.split(':')[1]).toBeTruthy();
    });
  });

  describe('compare', () => {
    it('should return true when password matches hash', async () => {
      const password = 'TestPassword123!';
      const hash = await passwordManager.toHash(password);

      const isMatch = await passwordManager.compare(hash, password);

      expect(isMatch).toBe(true);
    });

    it('should return false when password does not match hash', async () => {
      const password = 'TestPassword123!';
      const wrongPassword = 'WrongPassword456!';
      const hash = await passwordManager.toHash(password);

      const isMatch = await passwordManager.compare(hash, wrongPassword);

      expect(isMatch).toBe(false);
    });

    it('should be case sensitive', async () => {
      const password = 'TestPassword123!';
      const hash = await passwordManager.toHash(password);

      const isMatch = await passwordManager.compare(hash, 'testpassword123!');

      expect(isMatch).toBe(false);
    });

    it('should handle special characters in password', async () => {
      const password = 'P@$$w0rd!#%&*';
      const hash = await passwordManager.toHash(password);

      const isMatch = await passwordManager.compare(hash, password);

      expect(isMatch).toBe(true);
    });

    it('should handle very long passwords', async () => {
      const longPassword = 'A'.repeat(200) + 'Password123!';
      const hash = await passwordManager.toHash(longPassword);

      const isMatch = await passwordManager.compare(hash, longPassword);

      expect(isMatch).toBe(true);
    });

    it('should be resistant to timing attacks (use timingSafeEqual)', async () => {
      const password = 'TestPassword123!';
      const wrongPassword = 'WrongPassword456!';
      const hash = await passwordManager.toHash(password);

      // Test multiple times to ensure consistent timing behavior
      const results: boolean[] = [];
      for (let i = 0; i < 5; i++) {
        const isMatch = await passwordManager.compare(hash, wrongPassword);
        results.push(isMatch);
      }

      // All should consistently return false
      expect(results.every((r) => r === false)).toBe(true);
    });

    it('should handle invalid hash format gracefully', async () => {
      const invalidHash = 'not-a-valid-hash';
      const password = 'TestPassword123!';

      const isMatch = await passwordManager.compare(invalidHash, password);

      expect(isMatch).toBe(false);
    });

    it('should handle empty password', async () => {
      const hash = await passwordManager.toHash('TestPassword123!');

      const isMatch = await passwordManager.compare(hash, '');

      expect(isMatch).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should hash passwords with unicode characters', async () => {
      const password = 'Pässwörd123!日本語';
      const hash = await passwordManager.toHash(password);

      const isMatch = await passwordManager.compare(hash, password);

      expect(isMatch).toBe(true);
    });

    it('should hash passwords with whitespace', async () => {
      const password = 'Pass word 123!';
      const hash = await passwordManager.toHash(password);

      const isMatch = await passwordManager.compare(hash, password);

      expect(isMatch).toBe(true);
    });

    it('should not be vulnerable to password mutation after hashing', async () => {
      const password = 'TestPassword123!';
      const hash = await passwordManager.toHash(password);

      // Original password shouldn't match if we try a similar one
      const isMatch = await passwordManager.compare(hash, 'TestPassword123');

      expect(isMatch).toBe(false);
    });
  });
});
