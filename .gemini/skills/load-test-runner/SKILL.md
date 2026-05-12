---
name: load-test-runner
description: Use this skill to run and analyze load tests using the scripts/load-test.ts utility.
---
# Load Test Runner

Verify the performance and scalability of the system under stress.

## Workflow

1. **Setup Environment**: Ensure all microservices and infrastructure are running (`make run`).
2. **Execute Test**: Run the load test script:
   ```bash
   pnpm run load-test
   ```
3. **Analyze Results**: Observe the output for:
   - Request throughput (Req/sec).
   - Latency percentiles (P50, P95, P99).
   - Error rates.
4. **Compare with SLOs**: Verify if the results match the targets in `docs/RunbookOperacaoSLO.md` (e.g., P95 < 500ms).

## Implementation Detail
The test is implemented in `scripts/load-test.ts` using `tsx`.
