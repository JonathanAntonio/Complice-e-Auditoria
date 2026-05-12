# Convenção de Imports (Monorepo)

## Objetivo
Padronizar imports para reduzir acoplamento entre arquivos, facilitar refactors e evitar caminhos longos/frágeis.

## Regras
1. Para camadas `application`, prefira sempre os barrels `index.ts`:
- `application/use-cases`
- `application/dtos`
- `application/ports`

2. Evite importar arquivos concretos dessas pastas quando houver export no barrel.

3. Em adapters/controllers/services:
- Use `import type` para tipos.
- Use import de valor apenas para funções/classes necessárias.

4. Em novos módulos de `application`, ao criar arquivo novo, atualize o `index.ts` da pasta correspondente no mesmo PR.

5. Não crie barrels para tudo indiscriminadamente:
- Permitido: fronteiras estáveis (`dtos`, `ports`, `use-cases`).
- Evitar: barrels em pastas muito voláteis de implementação interna.

## Exemplos
Preferir:
- `from "../../../application/use-cases"`
- `from "../../../application/dtos"`
- `from "../../../application/ports"`

Evitar:
- `from "../../../application/use-cases/x.use-case"`
- `from "../../../application/dtos/y.dto"`
- `from "../../../application/ports/z.port"`

## Checklist de PR
1. Adicionou/alterou DTO, port ou use-case? Atualizou o barrel correspondente.
2. Há import direto para arquivo de `application/*` que já está exportado no barrel? Ajustar.
3. Rodar validação:
- `pnpm lint`
- testes do(s) pacote(s) alterado(s)
