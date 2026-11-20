# Funnel: Landing → Pago + registro → Webapp

## 1. Landing (`/`)
- Visitante sin sesión: CTA principal "Start your family plan" → `/signup`; "Sign in" en la cabecera → `/auth`; se mantiene "Try it without an account".
- Con sesión abierta: la cabecera y el CTA muestran "Open my week" → `/schedule` (sin redirigir a la fuerza, para que pueda ver la landing).

## 2. Pago + registro (`/signup`)
- Sin sesión: se abre el modal (Google, Apple, enlace mágico) sobre el checkout.
- Al confirmar el enlace, el modal se cierra solo y queda el pago visible (ya existe).
- Si el usuario ya tiene cuenta y entra en `/signup`, se le lleva directo a `/schedule` (no vuelve a ver el pago). Los pagos reales con tarjeta quedan pendientes de activar Paddle.
- "Skip for now" sigue disponible mientras no haya pagos reales.

## 3. Usuario registrado (vía directa)
- `/auth` con sesión ya abierta → directo a `/schedule`.
- Tras el enlace mágico o Google/Apple desde `/auth`, vuelve directo a `/schedule`, sin pasar por precios.
- Familia nueva sin datos → asistente inicial (como ahora).

## Detalles técnicos
- `index.tsx`: leer sesión en cliente y cambiar CTA.
- `signup.tsx`: si hay sesión al cargar y la cuenta ya tiene familia, `navigate({ to: "/schedule", replace: true })`; si es nueva, quedarse en el pago.
- `auth.tsx` / `MagicLinkAuth`: `returnTo="/schedule"` y redirección si ya hay sesión.
- Verificación con Playwright: visitante nuevo, nuevo registrado y usuario recurrente.
