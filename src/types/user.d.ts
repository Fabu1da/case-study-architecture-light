export type SafeUser = {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
}

export type LoginResponse = {
    user: SafeUser,
    tokens:{
        accessToken: string, 
        refreshToken: string
    }
}