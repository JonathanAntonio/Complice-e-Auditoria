---
name: typescript-security
description: Specialized guidance for TypeScript security, including Zod validation, JWT handling, and preventing OWASP vulnerabilities.
---
# TypeScript Security Expert

Focus on writing secure code and preventing vulnerabilities.

## Best Practices
- **Validation**: Always use `Zod` for runtime schema validation of external inputs.
- **Authentication**: Secure JWT implementation (proper secret management, expiration, and refresh tokens).
- **Injections**: Use Prisma to prevent SQL Injection; never concatenate raw strings in queries.
- **XSS/CSRF**: Configure `cors` and use security headers (e.g., `helmet` if available).
- **Rate Limiting**: Use `express-rate-limit` for public endpoints.
