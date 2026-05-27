# 🚀 How to you work?

# JWT Token Generation

- AccessToken: includes the subject (id) to whom the token belongs to and other useful information such as email
- RefreshToken: includes only the subject (id) — only used to issue a new AccessToken once it expires.

There is no golden rule, it can be customized and can hold more data about the user the token belongs to.
Two separate secrets are used for access and refresh tokens so they cannot be swapped for each other.

# loginUser

I chose not to validate the password on login, because if someone created an account before the policies were enforced, this could block them out of the system. Instead we enforce the policies only on registration. If old users change their password, the policies will be enforced at that point.

# User Service - safeUser

There is a more advanced way to clean up the user but I chose this because it is simpler and easy to understand:

```typescript
const safeUser: SafeUser = {
  id: loggedInUser.id,
  firstName: loggedInUser.firstName,
  lastName: loggedInUser.lastName,
  email: loggedInUser.email,
};
```

For example I could choose to use this but it comes with a drawback — it is not beginner friendly:

```typescript
const { password: _, ...userWithoutPassword }: { password: string } & SafeUser =
  loggedInUser;
```

# PasswordManagerService

- Used `scrypt` instead of `bcrypt` for hashing — scrypt is memory-hard making it more resistant to brute force and hardware attacks
- `timingSafeEqual` is used for hash comparison to prevent timing attacks — a timing attack is when an attacker measures how long the comparison takes to guess the password character by character
- `Uint8Array` is used instead of `Buffer` for TypeScript strict mode compatibility
- Salt is randomly generated using `randomBytes` for each password — this ensures two users with the same password will have different hashes

# Typeormconfig

- `getDataSource`: connects to local postgres in dev and AWS RDS in production
- `getParametersFromSSM`: fetches database credentials from AWS SSM Parameter Store. It is only used in production (ENV=prod). In dev, local environment variables are used instead
- Environments are separated for database setup — once the env changes the database automatically changes. It is of high risk to disturb the production database with local changes
- `synchronize` is disabled in production to prevent accidental schema changes — migrations should be used instead

# index.ts

- `helmet` is included for security — it sets various HTTP headers to protect the app
- `cors` is included to control which origins can access the API
- `process.exit(1)`: when a fatal error occurs during startup, without it the process stays alive in a broken state. Kubernetes relies on the exit code to know whether to restart the pod. With `process.exit(1)`, Kubernetes detects the crash and restarts the container automatically, avoiding a zombie state where the app is running but completely broken
- `parseInt` is used on PORT to ensure it is a number, not a string

# User Entity

- `email` has a unique constraint to prevent duplicate accounts
- `createdAt` and `updatedAt` are included for auditing and debugging
- `firstName` and `lastName` have a length limit of 100 characters
- `password` has no length limit since the stored value is a hash whose length depends on the hashing algorithm

# Types - user.types.ts

- Defines types related to user registration and authentication
- `SafeUser`: explicit safe shape of the user object — only exposes fields that are safe to return to the client. More maintainable than `Omit<User, 'password'>` because if new sensitive fields are added, they won't accidentally be exposed
- `LoginResponse`: defines the shape of the login response including the safe user and tokens
- Separating types from logic makes the code tidier, easier to read, and reusable across the codebase

# constant.ts

- Magic numbers and constants are separated from logic and reusable where necessary — this makes the code tidier and easier to read
- `PASSWORD_MIN_LENGTH`: minimum password character length (8)
- `SALT_BYTES`: bytes of randomness for salt generation (16 bytes = 128 bits) — higher means more unique salts
- `HASH_KEY_LENGTH`: bytes of hash output from scrypt (64 bytes = 512 bits) — higher means stronger hash but slower performance

# user-service.test.ts

20 test cases to make sure no requirement is left behind, separated into different groups:

## confirmPassword

- should return true when passwords match
- should return false when passwords do not match

Basic check to verify if the passwords match or not.

## validatePassword

- should return false when password is less than 8 characters
- should return false when password has no uppercase letter
- should return false when password has no lowercase letter
- should return false when password has no number
- should return false when password has no special character
- should return true for a valid password

For the sake of this project these validations are on the backend, but I would prefer to also put them on the frontend to avoid unnecessary requests to the backend. React has very nice packages for form validation such as `react-hook-form` combined with `zod`.

## validateEmail

- should return true for a valid email
- should return false for an invalid email

Email validation could also be handled on the frontend for a better user experience.

## User Registration

- should register a user successfully
- should throw if user already exists
- should throw if email is invalid
- should throw if passwords do not match
- should throw if password does not meet criteria

Very important tests — these make sure that the created user has a unique email and the password is correct and meets the criteria.

## User Login

- should login a user successfully
- should throw if user not found
- should throw if password is incorrect

Very important for login security — uses the same generic error message for both cases to avoid leaking whether an email exists in the system.

## getUserByEmail

- should return a user if found
- should return null if user not found
