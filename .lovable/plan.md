# Avisos e invitaciones solo por email

## Qué verás
- **Avisos por email:** cuando alguien te pide un cambio, lo acepta, lo rechaza, lo cancela o te deja una nota con "Let someone know", te llega un email con el resumen y un botón para abrirlo en la app. Cada persona puede apagarlo en Settings.
- **Invitar a la abuela (o a otro adulto):** en Family, el padre edita a la abuela, pone su email, guarda y pulsa **"Send invite"**. A ella le llega un email: "Michael te ha añadido a la familia en RunTheWeek". Abre el enlace, recibe su acceso y entra directa en la semana de la familia, sin pagar.
- También queda "Copy invite link" por si se lo quiere mandar a mano.
- Fuera WhatsApp: quito el botón de WhatsApp que añadí y la opción de SMS en Settings.

## Lo que necesitas hacer tú
- Para enviar emails hace falta un **dominio propio** (por ejemplo runtheweek.com). Te abriré la ventana para configurarlo. Sin él, la app funciona igual, pero los emails no salen.

## Detalles técnicos
- Configuración del dominio de email; scaffold de plantillas de app email.
- Plantillas: `family-alert` (título, texto, botón) e `family-invite` (quién invita, nombre de la familia, enlace a `/auth?email=`).
- `notify.ts`: el canal de email usa `sendTemplateEmail` con idempotencyKey por evento; se mantiene protegido para no romper la acción si el email falla. Se elimina el canal SMS/Twilio.
- Nueva server function `sendInvite` (requireSupabaseAuth): comprueba que el miembro es de tu familia, no está vinculado y tiene email; envía la invitación a ese email guardado (nunca a una dirección que mande el navegador).
- Family: `InviteBox` sin WhatsApp ni mailto; botón "Send invite" + copiar enlace. Settings: quitar texto/SMS.
- Roadmap: emails pendientes de dominio; WhatsApp/SMS descartados.
