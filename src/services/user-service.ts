// Fill here
import { inject, injectable } from "inversify";
import { UserRepository } from "../repositories/user-repository";
import jwt from "jsonwebtoken";
import { User } from "../entities";
import { TYPES } from "../lib";
import { PASSWORD_MIN_LENGTH  } from "../lib/constant";
import { PasswordManagerService } from "./password-manager-service";
import { LoginResponse, SafeUser} from "../types/user";


export interface UserService {
    registerUser(user: Omit<User, 'id'> & { confirmPassword: string } ): Promise<User>;
    getUserByEmail(email: string): Promise<User | null>;
    loginUser(email: string, password: string): Promise<LoginResponse>;
}


    @injectable()
export class UserServiceImpl implements UserService {

    constructor(
        @inject(TYPES.UserRepository) private userRepository: UserRepository, 
        @inject(TYPES.PasswordManagerService) private passwordManager: PasswordManagerService
    ) {}

    async registerUser(user: Omit<User, 'id'> & { confirmPassword: string }): Promise<User> {
        const existingUser = await this.userRepository.findByEmail(user.email);
        if (existingUser) {
            throw new Error("User with this email already exists");
        }
        if (!this.validateEmail(user.email)) {
            throw new Error("Invalid email format");
        }
        if (!this.confirmPassword(user.password, user.confirmPassword)) {
            throw new Error("Passwords do not match");
        }
        if (!this.validatePassword(user.password)) {
            throw new Error("Password does not meet the criteria");
        }

        const hashedPassword = await this.passwordManager.toHash(user.password);

        const userToCreate = new User();
        userToCreate.firstName = user.firstName;
        userToCreate.lastName = user.lastName;
        userToCreate.email = user.email;
        userToCreate.password = hashedPassword;

        return this.userRepository.create(userToCreate);
    }

    async loginUser(email: string, password: string): Promise<LoginResponse> {
       

        const loggedInUser = await this.getUserByEmail(email);
        
        if (!loggedInUser) {
            throw new Error("Invalid email or password");
        }

        const isMatch = await this.passwordManager.compare(loggedInUser.password, password);

        if (!isMatch) {
         throw new Error("Invalid email or password");
        }

        const jwtSecret = process.env.JWT_SECRET;
        const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET

        if (!jwtSecret || !jwtRefreshSecret) {
            throw new Error("JWT secrets are not defined in environment variables");
        }

        const accessToken = jwt.sign(
            { sub: loggedInUser.id, email: loggedInUser.email }, 
            jwtSecret, 
            { expiresIn: (process.env.JWT_EXPIRES_IN ?? '24h') as jwt.SignOptions['expiresIn'] });
        
        const refreshToken = jwt.sign(
            { sub: loggedInUser.id }, 
            jwtRefreshSecret, 
            { expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN ?? '7d') as jwt.SignOptions['expiresIn'] }) 

        
        const safeUser: SafeUser = {
            id: loggedInUser.id,
            firstName: loggedInUser.firstName,
            lastName: loggedInUser.lastName,
            email: loggedInUser.email,
        };

        const loginResponse: LoginResponse = {
            user: safeUser,
            tokens: {
                accessToken,    
                refreshToken
            },
        };

        return loginResponse;
    }

    async getUserByEmail(email: string): Promise<User | null> {
        return this.userRepository.findByEmail(email);
    }

    private confirmPassword(password: string, confirmPassword: string): boolean {
        return password === confirmPassword;
    }

    private validateEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    private validatePassword(password: string): boolean {
        return (
            password.length >= PASSWORD_MIN_LENGTH &&
            this.hasRequiredCharacters(password) &&
            this.hasSpecialCharacter(password)
        );
    }

    private hasRequiredCharacters(password: string): boolean {
        return /[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password);
    }

    private hasSpecialCharacter(password: string): boolean {
        return /[!@#$%^&*(),.?":{}|<>]/.test(password);
    }

    
}

