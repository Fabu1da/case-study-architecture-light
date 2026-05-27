// Fill here

import { injectable, inject } from "inversify";
import {DataSource} from "typeorm";
import { User } from "../entities/user";
import {TYPES} from "../lib";

export interface UserRepository {
    create(user: User): Promise<User>;
    findByEmail(email: string): Promise<User | null>;
}
@injectable()
export class UserRepositoryImpl implements UserRepository {
    constructor(@inject(TYPES.DB) private dataSource: DataSource) {}

    async create(user: User): Promise<User> {
        const userRepository = this.dataSource.getRepository(User);
        return await userRepository.save(user);
    }

    async findByEmail(email: string): Promise<User | null> {
        const userRepository = this.dataSource.getRepository(User);
        return await userRepository.findOne({ where: { email } });
    }
}
