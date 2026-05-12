---
name: tdd-business-validator
description: Use this skill to map business rules (RN-XXX) from documentation to automated tests (Vitest, Playwright).
---
# TDD Business Validator

This skill ensures that every code change is backed by the business rules defined in the project.

## Workflow

1. **Identify the Rule**: Look up the relevant `RN-XXX` in `docs/RegrasDeNegocio.md`.
2. **Create a Reproduction/Test Case**:
   - For Backend: Create a `.spec.ts` or `.integration.spec.ts` using Vitest/Supertest.
   - For Frontend: Create a Vitest test for the logic or a Playwright test for the UI.
3. **Verify Compliance**:
   - Link the test description to the Rule ID (e.g., `describe('RN-003: Login blocking', ...)`).
4. **Implement the Fix/Feature**: Only after the test is in place (Red-Green-Refactor).

## References
- `docs/RegrasDeNegocio.md`: Source of truth for rules.
- `docs/MatrizRastreabilidadeCodigo.md`: Mapping of rules to code locations.
