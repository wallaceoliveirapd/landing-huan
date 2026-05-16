# Modelo de Segurança — huanfalcao.com.br

## Convex e "Row Level Security"

Convex **não é Postgres/Supabase**. Não existe RLS no sentido SQL —
não dá pra escrever uma policy declarativa do tipo
`USING (auth.uid() = userId)`.

O modelo de segurança do Convex é **function-based**: toda leitura e
escrita acontece por queries/mutations/actions, e a autorização é
forçada dentro de cada handler com `getAuthUserId(ctx)`. Não há acesso
direto ao banco a partir do cliente — só por essas funções, controladas
por nós.

### Equivalente prático ao RLS

| RLS clássico                                       | Equivalente Convex                                                                                                 |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `USING (auth.uid() = userId)`                      | No handler: `const userId = await getAuthUserId(ctx); if (!userId) throw …; if (doc.userId !== userId) throw …` |
| `FOR INSERT WITH CHECK (auth.role() = 'admin')`    | Helper `requireAdmin(ctx)` chamado no topo de toda mutation admin                                                  |
| Policy por tabela                                  | Convenção: índices por `by_user`, `by_email`, etc., e checks consistentes nos handlers                             |
| RLS bypass via service role                        | `internalMutation`/`internalAction`/`internalQuery` — só chamáveis de outras funções do servidor, nunca do cliente |

### Onde isso já está aplicado

- `convex/usersAdmin.ts:requireAdmin` — admin-only enforcement (lança quando role ≠ "admin")
- `convex/users.ts:myRole` — query usada pelo guard server-side em
  `app/(admin)/admin/(protected)/layout.tsx` e por `proxy.ts`
- `convex/trips.ts` — todo `getById`/`update`/`delete` confere
  `trip.userId === userId` antes de retornar/mutar
- `convex/favorites.ts`, `reviews.ts`, `reactions.ts`, `notifications.ts`,
  `dataExport.ts` — todas filtram por `userId` do `getAuthUserId(ctx)`
- `convex/push.ts` — actions admin-only via `requireAdmin`
- `convex/usersAdmin.ts:setRole` — protege contra demoção do último admin

### Checklist de auditoria (rodar sempre que adicionar uma tabela)

1. A função expõe dados de outros usuários? Filtrar por `userId`.
2. A função muta dados de outro usuário? Verificar ownership antes de
   patch/delete.
3. A função é admin-only? Chamar `requireAdmin(ctx)`.
4. A função é interna (chamada por outra função)? Marcar como
   `internalQuery`/`internalMutation`/`internalAction` — assim nunca é
   exposta ao cliente.
5. Joga erros estruturados com `ConvexError({ code, message })` — não
   `throw new Error("string solta")` que o cliente fica tendo que
   pattern-matchar.

---

## CORS

Implementado em `proxy.ts`. Bloqueia requisições cross-origin a `/api/*`
fora da allowlist:

- `https://huanfalcao.com.br` + `https://www.huanfalcao.com.br`
- Previews `*.vercel.app`
- `localhost` / `127.0.0.1` (dev)

Origens fora da lista recebem `403 { error: "CORS: origin not allowed" }`.
Preflight `OPTIONS` é respondido com 204 + headers CORS.

## Security Headers

Em `next.config.ts` via `async headers()`. Aplicado a `/:path*`:

- `Content-Security-Policy` — restringe scripts, styles, conexões.
  - `connect-src` libera Convex (`*.convex.cloud`), Mapbox, OSM,
    GTM/GA, Facebook, R2.
  - `script-src` libera GTM + Meta Pixel + `unsafe-inline`/`unsafe-eval`
    porque Next inline-runtime ainda exige.
  - `frame-ancestors 'none'` — protege contra clickjacking.
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` — bloqueia câmera, microfone, FLoC; libera
  geolocation só pra `self`.
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `poweredByHeader: false` — remove `X-Powered-By: Next.js`

Pra apertar mais a CSP no futuro: implementar nonces server-side e
remover `unsafe-inline` de `script-src`.

---

## Tratamento de erros — convenções

### Cliente

- **Toasts**: `sonner` (`Toaster` no `AppProviders`). Use
  `toast.error(...)` / `toast.success(...)` / `toast.warning(...)`.
- **Helper**: `lib/errors.ts`
  - `getErrorMessage(err, fallback?)` — string user-safe
  - `getErrorCode(err)` — pega `data.code` de ConvexError
  - `logAndGetMessage(context, err, fallback?)` — loga full err + retorna msg
- **Padrão em event handlers**:
  ```ts
  try {
    await mutation(args);
    toast.success("Salvo!");
  } catch (err) {
    toast.error(logAndGetMessage("scope.action", err, "Fallback msg."));
  }
  ```

### Boundaries

- `app/error.tsx` — segment-level (catch render errors em qualquer rota)
- `app/global-error.tsx` — root (catch errors no próprio layout)
- `app/not-found.tsx` — 404
- `components/atoms/ErrorBoundary.tsx` — class component pra envolver
  widgets de alto risco (chat, mapa, carrossel) quando uma falha não
  deve apagar a página toda

### Servidor (Convex)

- Lançar `ConvexError({ code, message, ...extras })` quando o cliente
  precisa distinguir o erro (ex.: `TRIP_LIMIT_REACHED`).
- Lançar `new Error("...")` simples só pra erros que viram 5xx genérico.
- Nunca expor stack/payload bruto pro cliente.
