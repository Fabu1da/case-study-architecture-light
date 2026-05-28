import { UserServiceImpl } from '../../src/services/user-service';
import { UserRepository } from '../../src/repositories/user-repository';
import { PasswordManagerService } from '../../src/services/password-manager-service';

describe('UserServiceImpl', () => {
    let userService: UserServiceImpl;
    let mockUserRepository: jest.Mocked<UserRepository>;
    let mockPasswordManager: jest.Mocked<PasswordManagerService>;

    const mockUser = {
        id: 1,
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        password: "Password123!",
    };

    beforeEach(() => {

        process.env.JWT_SECRET = 'test-secret';
        process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

        mockUserRepository = {
            findByEmail: jest.fn(),
            create: jest.fn(),
        } as any;

        mockPasswordManager = {
            toHash: jest.fn(),
            compare: jest.fn(),
        } as any;

        userService = new UserServiceImpl(mockUserRepository, mockPasswordManager);
    });

    // clean up after each test
    afterEach(() => {
        delete process.env.JWT_SECRET;
        delete process.env.JWT_REFRESH_SECRET;
    });

    describe('confirmPassword', () => {
        it('should return true when passwords match', () => {
            expect(userService['confirmPassword']('Password123!', 'Password123!')).toBe(true);
        });

        it('should return false when passwords do not match', () => {
            expect(userService['confirmPassword']('Password123!', 'Password456!')).toBe(false);
        });
    });

    describe('validatePassword', () => {
        it('should return false when password is less than 8 characters', () => {
            expect(userService['validatePassword']('Pa1!')).toBe(false);
        });

        it('should return false when password has no uppercase letter', () => {
            expect(userService['validatePassword']('password123!')).toBe(false);
        });

        it('should return false when password has no lowercase letter', () => {
            expect(userService['validatePassword']('PASSWORD123!')).toBe(false);
        });

        it('should return false when password has no number', () => {
            expect(userService['validatePassword']('Password!')).toBe(false);
        });

        it('should return false when password has no special character', () => {
            expect(userService['validatePassword']('Password123')).toBe(false);
        });

        it('should return true for a valid password', () => {
            expect(userService['validatePassword']('Password123!')).toBe(true);
        });
    });

    describe('validateEmail', () => {
        it('should return true for a valid email', () => {
            expect(userService['validateEmail']('test@example.com')).toBe(true);
        });

        it('should return false for an invalid email', () => {
            expect(userService['validateEmail']('invalid.email')).toBe(false);
        });
    });

    describe('User Registration', () => {
        const registerUser = {
            ...mockUser,
            confirmPassword: "Password123!"
        };

        it('should register a user successfully', async () => {
            mockUserRepository.findByEmail.mockResolvedValue(null);
            mockPasswordManager.toHash.mockResolvedValue("hashedPassword");
            mockUserRepository.create.mockResolvedValue(mockUser);

            const result = await userService.registerUser(registerUser);

            expect(result).toEqual(mockUser);
            expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(registerUser.email);
            expect(mockPasswordManager.toHash).toHaveBeenCalledWith(registerUser.password);
            expect(mockUserRepository.create).toHaveBeenCalled();
        });

        it('should throw if user already exists', async () => {
            mockUserRepository.findByEmail.mockResolvedValue(mockUser);

            await expect(userService.registerUser(registerUser))
                .rejects.toThrow('User with this email already exists');
        });

        it('should throw if email is invalid', async () => {
            const invalidUser = { ...registerUser, email: 'invalid.email' };

            await expect(userService.registerUser(invalidUser))
                .rejects.toThrow('Invalid email format');
        });

        it('should throw if passwords do not match', async () => {
            const mismatchUser = { ...registerUser, confirmPassword: 'DifferentPassword123!' };
            mockUserRepository.findByEmail.mockResolvedValue(null);

            await expect(userService.registerUser(mismatchUser))
                .rejects.toThrow('Passwords do not match');
        });

        it('should throw if password does not meet criteria', async () => {
            const weakPasswordUser = { ...registerUser, password: 'weak', confirmPassword: 'weak' };
            mockUserRepository.findByEmail.mockResolvedValue(null);

            await expect(userService.registerUser(weakPasswordUser))
                .rejects.toThrow('Password does not meet the criteria');
        });
    });

    describe('User Login', () => {
        const email = "john.doe@example.com";
        const password = "Password123!";

        it('should login a user successfully', async () => {
            mockUserRepository.findByEmail.mockResolvedValue({
                ...mockUser,
                password: "hashedPassword"
            });
            mockPasswordManager.compare.mockResolvedValue(true);

            const result = await userService.loginUser(email, password);

            expect(result).toEqual({
                user: {
                    id: mockUser.id,
                    firstName: mockUser.firstName,
                    lastName: mockUser.lastName,
                    email: mockUser.email,
                },
                tokens: {
                    accessToken: expect.any(String),
                    refreshToken: expect.any(String),
                }
            });
            expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(email);
            expect(mockPasswordManager.compare).toHaveBeenCalled();
        });

        it('should throw if user not found', async () => {
            mockUserRepository.findByEmail.mockResolvedValue(null);

            await expect(userService.loginUser(email, password))
                .rejects.toThrow('Invalid email or password');
        });

        it('should throw if password is incorrect', async () => {
            mockUserRepository.findByEmail.mockResolvedValue({
                ...mockUser,
                password: "hashedPassword"
            });
            mockPasswordManager.compare.mockResolvedValue(false);

            await expect(userService.loginUser(email, 'WrongPassword123!'))
                .rejects.toThrow('Invalid email or password');
        });
    });

    describe('getUserByEmail', () => {
        it('should return a user if found', async () => {
            mockUserRepository.findByEmail.mockResolvedValue(mockUser);

            const result = await userService.getUserByEmail(mockUser.email);

            expect(result).toEqual(mockUser);
            expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(mockUser.email);
        });

        it('should return null if user not found', async () => {
            mockUserRepository.findByEmail.mockResolvedValue(null);

            const result = await userService.getUserByEmail('notfound@example.com');

            expect(result).toBeNull();
        });
    });
});
