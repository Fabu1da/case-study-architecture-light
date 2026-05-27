// Fill here
import { Request, Response } from "express";
import { controller, httpPost } from "inversify-express-utils";
import { inject } from "inversify";
import { UserService } from "../services";
import { BaseController, TYPES } from "../lib";
import { User } from "entities/user";
@controller('/users')
export class UserController extends BaseController {
    constructor(@inject(TYPES.UserService) private userService: UserService) {
        super();
    }
    @httpPost('/register')
    public async registerUser(req: Request, res: Response): Promise<void> {
        try {

            const { firstName, lastName, email, password: userPassword, confirmPassword } = req.body;
            
            if (!firstName || !lastName || !email || !userPassword || !confirmPassword) {
                res.status(400).json({ error: "All fields are required" });
                return;
            }

            const userToRegister: Omit<User, 'id'> & { confirmPassword: string } = {
                firstName,
                lastName,
                email,
                password: userPassword,
                confirmPassword
            };
            
            await this.userService.registerUser(userToRegister);
           
            res.status(201).json({ message: "User registered successfully" });
        
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }


    @httpPost('/login')
    public async loginUser(req: Request, res: Response): Promise<void> {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                res.status(400).json({ error: "Email and password are required" });
                return;
            }
            const loginResponse = await this.userService.loginUser( email , password);
            res.status(200).json(loginResponse);
        
        } catch (error: any) {
            res.status(401).json({ error: error.message });
        }
    }
}
