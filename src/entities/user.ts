import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

 @Entity({ name: 'users' })
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 100 })
    firstName: string;

    @Column({ length: 100 })
    lastName: string;

    @Column({ unique: true, length: 100 })
    email: string;

    @Column()
    password: string;
}
