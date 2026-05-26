# 🚀 Senior Full Stack Engineer Case Study

## User Authentication Service

Welcome to the marta Senior Full Stack Engineer technical case study. This repository contains a boilerplate microservice architecture that you will use to implement a **User Authentication Service**.

---

## 📋 Overview

Your task is to build a fully functional user authentication service using the provided boilerplate. The service should handle user registration and authentication.

### Time Expectation
- **Estimated time:** 1-2 hours
- Focus on code quality over feature completeness

---

## 🎯 Requirements

### Core Features

#### 1. User Registration
- Create an endpoint to register new users
- Required fields: `email`, `password`, `firstName`, `lastName`
- Email must be unique and validated
- Password must meet security requirements (minimum 8 characters, at least one uppercase, one lowercase, and one number)

#### 2. User Authentication
- Implement a login endpoint that accepts `email` and `password`
- Return a JWT token upon successful authentication
- Implement proper error handling for invalid credentials

---

## 🏗️ Architecture

The boilerplate follows an architecture pattern with:

```
src/
├── controllers/     # HTTP request handlers
├── services/        # Business logic layer
├── repositories/    # Data access layer
├── entities/        # TypeORM entities
├── lib/             # Shared utilities and types
└── events/          # Event handlers (optional)
```

### Tech Stack
- **Runtime:** Node.js with TypeScript
- **Framework:** Express.js with inversify-express-utils
- **Database:** PostgreSQL with TypeORM
- **DI Container:** Inversify
- **Testing:** Jest with Supertest


---

## 🔧 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Yarn package manager

### Installation

```bash
# Install dependencies
yarn install

# Set up environment variables
cp env.example .env

# Start development server
yarn dev
```

### Environment Variables

Create a `.env` file with the following variables:

```env
PORT=9000
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=case_study_db
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h
```

### Running Tests

```bash
# Run all tests
yarn test

# Run tests in watch mode
yarn test:watch
```

---

## ✅ Evaluation Criteria

Your submission will be evaluated based on:

### Code Quality (30%)
- Clean, readable, and maintainable code
- Proper TypeScript usage with appropriate types
- Consistent coding style (ESLint & Prettier)
- SOLID principles adherence

### Architecture (25%)
- Proper separation of concerns
- Correct use of dependency injection
- Repository pattern implementation
- Error handling strategy

### Security (20%)
- Secure password hashing implementation
- JWT token handling
- Input validation and sanitization
- Protection against common vulnerabilities

### Testing (15%)
- Unit tests for services
- Integration tests for API endpoints
- Edge case coverage

### Notes (10%)
- Tools
- AI prompt samples (if applicable)
- Reasons for certain decisions

---

## 📦 Deliverables

1. Complete implementation of all required features
2. Unit tests for services (minimum 80% coverage)
3. Integration tests for API endpoints
4. Brief documentation of your design decisions in TASK.md
---

## 📚 Helpful Resources

- [Inversify Documentation](https://inversify.io/)
- [TypeORM Documentation](https://typeorm.io/)
- [Express.js Documentation](https://expressjs.com/)
- [JWT Introduction](https://jwt.io/introduction)

---

## 🤝 Submission

1. Fork this repository
2. Leave the fork network with your new repository so that other applicants cannot see your solution.
3. Implement the required features
4. Push your changes and send us an email with a link to your public accessible repository 
5. Include any notes, decisions and assumptions into TASK.md

---

## ❓ Questions?

If you have any questions about the requirements or need clarification, please reach out to your hiring contact.

**Good luck! We're excited to see your solution.** 🎉
