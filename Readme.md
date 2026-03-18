# Project Name

Serverless AWS Lambda project with Middy middleware, DynamoDB, and TypeScript, tested with Vitest.

⸻

Description

This project demonstrates a Serverless architecture using AWS Lambda and DynamoDB. It includes:
• API Gateway REST endpoints
• Lambda handlers using Middy middleware for input validation, error handling, and JSON parsing
• Repository-Service-Handler structure following Onion/Clean architecture
• Input validation with Zod
• Unit and integration testing using Vitest
• Local DynamoDB mocking for tests

⸻

Architecture
• Handler Layer: Handles API Gateway events, uses Middy for middleware.
• Service Layer: Contains business logic, calls repository methods.
• Repository Layer: Interacts with DynamoDB.
• Middleware: Handles validation, error formatting, JSON parsing.

API Gateway --> Lambda Handler --> Service --> Repository --> DynamoDB
|
--> Middy Middleware (validation, error handling)

⸻

Technologies
• Language: TypeScript
• Framework: Serverless Framework
• Middleware: Middy
• Validation: Zod
• Database: DynamoDB (AWS)
• Testing: Vitest, Faker.js
• AWS SDK: @aws-sdk/lib-dynamodb

⸻

Installation

# Install dependencies

npm install

# or

pnpm install

⸻

Environment Variables

Create a .env file:

USERS_TABLE=your-dynamodb-table
AWS_REGION=your-region

    •	USERS_TABLE – DynamoDB table name for users
    •	AWS_REGION – AWS region

⸻

Serverless Deployment

# Deploy to AWS

npx serverless deploy

# Invoke a function

npx serverless invoke -f create-user --data '{"name": "John", "email": "john@example.com"}'

# Remove deployment

npx serverless remove

⸻

Running Locally

You can test Lambda handlers locally:

# Start local server

npx serverless offline

# Or invoke function locally

npx serverless invoke local -f create-user --data '{"name": "John", "email": "john@example.com"}'

⸻

Testing

Unit and integration tests are written with Vitest.

# Run all tests

npm run test

# Run unit tests only

npm run test:unit

# Run integration tests only

npm run test:integration

# Run tests with coverage

npm run test:coverage

    •	Unit tests: Mock dependencies like DynamoDB and services
    •	Integration tests: Test Lambda handlers with actual middleware behavior
    •	Mocks: Use vi.mock or vi.spyOn for dependencies

⸻

Project Structure

src/
├─ clients/ # AWS clients (DynamoDB, etc.)
├─ handlers/ # Lambda handlers
│ └─ user/
│ └─ create-user-handler.ts
├─ repositories/ # Repository layer (DB access)
│ └─ user/
├─ services/ # Service layer (business logic)
├─ schemas/ # Zod schemas
├─ tests/
│ ├─ unit/
│ └─ integration/
└─ utils/ # Helpers & middleware

⸻

Contributing 1. Fork the repository 2. Create a feature branch (git checkout -b feature/my-feature) 3. Commit your changes (git commit -m 'Add some feature') 4. Push to the branch (git push origin feature/my-feature) 5. Create a pull request

⸻

License

MIT License © 2026

⸻

I can also generate a more detailed README that includes:
• Example API request/response for create-user
• Error responses (400, 500, invalid JSON)
• Example of mocking in unit/integration tests

Do you want me to do that next?
