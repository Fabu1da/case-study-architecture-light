import 'reflect-metadata';
import request from 'supertest';
import { InversifyExpressServer } from 'inversify-express-utils';
import { Container } from 'inversify';
import { json } from 'body-parser';
import helmet from 'helmet';
import cors from 'cors';

import { UserController } from '../../src/controllers/user-controller';
import { UserServiceImpl } from '../../src/services/user-service';
import { TYPES } from '../../src/lib';
import { UserRepository } from '../../src/repositories/user-repository';
import { PasswordManagerService } from '../../src/services/password-manager-service';

describe('User Controller Integration Tests', () => {
  let app: any;
  let mockUserRepository: jest.Mocked<UserRepository>;
  let mockPasswordManager: jest.Mocked<PasswordManagerService>;

  const mockUser = {
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    password: 'hashedPassword',
  };

  beforeEach(() => {
    // Set up environment variables
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

    // Create mocks
    mockUserRepository = {
      findByEmail: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
    } as any;

    mockPasswordManager = {
      toHash: jest.fn(),
      compare: jest.fn(),
    } as any;

    // Create DI container
    const diContainer = new Container();

    // Bind dependencies
    diContainer.bind<UserRepository>(TYPES.UserRepository).toConstantValue(mockUserRepository);
    diContainer.bind<PasswordManagerService>(TYPES.PasswordManagerService).toConstantValue(mockPasswordManager);
    diContainer.bind<UserServiceImpl>(TYPES.UserService).to(UserServiceImpl);
    diContainer.bind<UserController>(UserController).to(UserController);

    // Create Inversify Express Server
    const server = new InversifyExpressServer(diContainer, null, {
      rootPath: '/partner-app/api',
    });

    server.setConfig((app) => {
      app.use(json());
      app.use(helmet());
      app.use(cors());
    });

    app = server.build();
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
    delete process.env.JWT_REFRESH_SECRET;
  });

  describe('POST /partner-app/api/users/register', () => {
    describe('Success Cases', () => {
      it('should register a new user successfully', async () => {
        const userData = {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          password: 'Password123!',
          confirmPassword: 'Password123!',
        };

        mockUserRepository.findByEmail.mockResolvedValue(null);
        mockPasswordManager.toHash.mockResolvedValue('hashedPassword');
        mockUserRepository.create.mockResolvedValue(mockUser);

        const response = await request(app)
          .post('/partner-app/api/users/register')
          .send(userData)
          .expect(201);

        expect(response.body).toHaveProperty('message', 'User registered successfully');
        expect(response.body).toHaveProperty('user');
        expect(response.body.user.email).toBe(userData.email);
        expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(userData.email);
        expect(mockPasswordManager.toHash).toHaveBeenCalledWith(userData.password);
        expect(mockUserRepository.create).toHaveBeenCalled();
      });

      it('should hash password before storing', async () => {
        const userData = {
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@example.com',
          password: 'SecurePass456!',
          confirmPassword: 'SecurePass456!',
        };

        mockUserRepository.findByEmail.mockResolvedValue(null);
        mockPasswordManager.toHash.mockResolvedValue('hashedSecurePassword');
        mockUserRepository.create.mockResolvedValue({
          ...mockUser,
          email: userData.email,
        });

        await request(app)
          .post('/partner-app/api/users/register')
          .send(userData)
          .expect(201);

        expect(mockPasswordManager.toHash).toHaveBeenCalledWith(userData.password);
      });
    });

    describe('Validation Errors', () => {
      it('should return 400 if email is missing', async () => {
        const userData = {
          firstName: 'John',
          lastName: 'Doe',
          password: 'Password123!',
          confirmPassword: 'Password123!',
        };

        const response = await request(app)
          .post('/partner-app/api/users/register')
          .send(userData)
          .expect(400);

        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('All fields are required');
      });

      it('should return 400 if firstName is missing', async () => {
        const userData = {
          lastName: 'Doe',
          email: 'john@example.com',
          password: 'Password123!',
          confirmPassword: 'Password123!',
        };

        const response = await request(app)
          .post('/partner-app/api/users/register')
          .send(userData)
          .expect(400);

        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('All fields are required');
      });

      it('should return 400 if lastName is missing', async () => {
        const userData = {
          firstName: 'John',
          email: 'john@example.com',
          password: 'Password123!',
          confirmPassword: 'Password123!',
        };

        const response = await request(app)
          .post('/partner-app/api/users/register')
          .send(userData)
          .expect(400);

        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('All fields are required');
      });

      it('should return 400 if password is missing', async () => {
        const userData = {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          confirmPassword: 'Password123!',
        };

        const response = await request(app)
          .post('/partner-app/api/users/register')
          .send(userData)
          .expect(400);

        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('All fields are required');
      });

      it('should return 400 if confirmPassword is missing', async () => {
        const userData = {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          password: 'Password123!',
        };

        const response = await request(app)
          .post('/partner-app/api/users/register')
          .send(userData)
          .expect(400);

        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('All fields are required');
      });

      it('should return 400 if email is invalid', async () => {
        const userData = {
          firstName: 'John',
          lastName: 'Doe',
          email: 'invalid-email',
          password: 'Password123!',
          confirmPassword: 'Password123!',
        };

        mockUserRepository.findByEmail.mockResolvedValue(null);

        const response = await request(app)
          .post('/partner-app/api/users/register')
          .send(userData)
          .expect(400);

        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('Invalid email format');
      });

      it('should return 400 if passwords do not match', async () => {
        const userData = {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          password: 'Password123!',
          confirmPassword: 'DifferentPassword123!',
        };

        mockUserRepository.findByEmail.mockResolvedValue(null);

        const response = await request(app)
          .post('/partner-app/api/users/register')
          .send(userData)
          .expect(400);

        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('Passwords do not match');
      });

      it('should return 400 if password is too short', async () => {
        const userData = {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          password: 'Pass1!',
          confirmPassword: 'Pass1!',
        };

        mockUserRepository.findByEmail.mockResolvedValue(null);

        const response = await request(app)
          .post('/partner-app/api/users/register')
          .send(userData)
          .expect(400);

        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('Password does not meet the criteria');
      });

      it('should return 400 if password missing uppercase', async () => {
        const userData = {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          password: 'password123!',
          confirmPassword: 'password123!',
        };

        mockUserRepository.findByEmail.mockResolvedValue(null);

        const response = await request(app)
          .post('/partner-app/api/users/register')
          .send(userData)
          .expect(400);

        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('Password does not meet the criteria');
      });

      it('should return 400 if password missing lowercase', async () => {
        const userData = {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          password: 'PASSWORD123!',
          confirmPassword: 'PASSWORD123!',
        };

        mockUserRepository.findByEmail.mockResolvedValue(null);

        const response = await request(app)
          .post('/partner-app/api/users/register')
          .send(userData)
          .expect(400);

        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('Password does not meet the criteria');
      });

      it('should return 400 if password missing number', async () => {
        const userData = {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          password: 'Password!',
          confirmPassword: 'Password!',
        };

        mockUserRepository.findByEmail.mockResolvedValue(null);

        const response = await request(app)
          .post('/partner-app/api/users/register')
          .send(userData)
          .expect(400);

        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('Password does not meet the criteria');
      });

      it('should return 400 if password missing special character', async () => {
        const userData = {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          password: 'Password123',
          confirmPassword: 'Password123',
        };

        mockUserRepository.findByEmail.mockResolvedValue(null);

        const response = await request(app)
          .post('/partner-app/api/users/register')
          .send(userData)
          .expect(400);

        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('Password does not meet the criteria');
      });
    });

    describe('Duplicate User Error', () => {
      it('should return 400 if email already exists', async () => {
        const userData = {
          firstName: 'John',
          lastName: 'Doe',
          email: 'existing@example.com',
          password: 'Password123!',
          confirmPassword: 'Password123!',
        };

        mockUserRepository.findByEmail.mockResolvedValue(mockUser);

        const response = await request(app)
          .post('/partner-app/api/users/register')
          .send(userData)
          .expect(400);

        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('User with this email already exists');
      });
    });
  });

  describe('POST /partner-app/api/users/login', () => {
    describe('Success Cases', () => {
      it('should login successfully with correct credentials', async () => {
        const loginData = {
          email: 'john.doe@example.com',
          password: 'Password123!',
        };

        mockUserRepository.findByEmail.mockResolvedValue(mockUser);
        mockPasswordManager.compare.mockResolvedValue(true);

        const response = await request(app)
          .post('/partner-app/api/users/login')
          .send(loginData)
          .expect(200);

        expect(response.body).toHaveProperty('user');
        expect(response.body).toHaveProperty('tokens');
        expect(response.body.user.email).toBe(loginData.email);
        expect(response.body.tokens).toHaveProperty('accessToken');
        expect(response.body.tokens).toHaveProperty('refreshToken');
        expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(loginData.email);
        expect(mockPasswordManager.compare).toHaveBeenCalled();
      });

      it('should return valid JWT tokens', async () => {
        const loginData = {
          email: 'john.doe@example.com',
          password: 'Password123!',
        };

        mockUserRepository.findByEmail.mockResolvedValue(mockUser);
        mockPasswordManager.compare.mockResolvedValue(true);

        const response = await request(app)
          .post('/partner-app/api/users/login')
          .send(loginData)
          .expect(200);

        expect(response.body.tokens.accessToken).toBeTruthy();
        expect(response.body.tokens.refreshToken).toBeTruthy();
        expect(typeof response.body.tokens.accessToken).toBe('string');
        expect(typeof response.body.tokens.refreshToken).toBe('string');
      });

      it('should not return password in response', async () => {
        const loginData = {
          email: 'john.doe@example.com',
          password: 'Password123!',
        };

        mockUserRepository.findByEmail.mockResolvedValue(mockUser);
        mockPasswordManager.compare.mockResolvedValue(true);

        const response = await request(app)
          .post('/partner-app/api/users/login')
          .send(loginData)
          .expect(200);

        expect(response.body.user).not.toHaveProperty('password');
      });
    });

    describe('Validation Errors', () => {
      it('should return 400 if email is missing', async () => {
        const loginData = {
          password: 'Password123!',
        };

        const response = await request(app)
          .post('/partner-app/api/users/login')
          .send(loginData)
          .expect(400);

        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('Email and password are required');
      });

      it('should return 400 if password is missing', async () => {
        const loginData = {
          email: 'john@example.com',
        };

        const response = await request(app)
          .post('/partner-app/api/users/login')
          .send(loginData)
          .expect(400);

        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('Email and password are required');
      });
    });

    describe('Authentication Errors', () => {
      it('should return 401 if user not found', async () => {
        const loginData = {
          email: 'notfound@example.com',
          password: 'Password123!',
        };

        mockUserRepository.findByEmail.mockResolvedValue(null);

        const response = await request(app)
          .post('/partner-app/api/users/login')
          .send(loginData)
          .expect(401);

        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('Invalid email or password');
      });

      it('should return 401 if password is incorrect', async () => {
        const loginData = {
          email: 'john.doe@example.com',
          password: 'WrongPassword123!',
        };

        mockUserRepository.findByEmail.mockResolvedValue(mockUser);
        mockPasswordManager.compare.mockResolvedValue(false);

        const response = await request(app)
          .post('/partner-app/api/users/login')
          .send(loginData)
          .expect(401);

        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('Invalid email or password');
      });

      it('should not distinguish between invalid email and password', async () => {
        // For security, we should not tell attackers whether the email exists or not

        const invalidEmailResponse = await request(app)
          .post('/partner-app/api/users/login')
          .send({ email: 'notfound@example.com', password: 'Password123!' })
          .expect(401);

        mockUserRepository.findByEmail.mockResolvedValue(mockUser);
        mockPasswordManager.compare.mockResolvedValue(false);

        const invalidPasswordResponse = await request(app)
          .post('/partner-app/api/users/login')
          .send({ email: 'john.doe@example.com', password: 'WrongPassword123!' })
          .expect(401);

        // Both should return the same error message
        expect(invalidEmailResponse.body.error).toContain('Invalid email or password');
        expect(invalidPasswordResponse.body.error).toContain('Invalid email or password');
      });
    });
  });
});
