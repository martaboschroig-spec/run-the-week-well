# Revisión de permisos y protección de datos

## Lo que ya está bien (comprobado)
- Todas las tablas tienen reglas de acceso activas: cada familia solo ve y edita lo suyo.
- Avisos y mensajes: cada persona solo ve los suyos.
- Cambios de turno (pedir, aceptar, rechazar): solo pasan por reglas del servidor y nadie puede saltárselas.
- Documentos subidos: solo los ve la familia a la que pertenecen.
- Roles: cada persona solo ve su propio rol; el panel "Users & roles" comprueba en el servidor que seas Admin o Soporte; desde la app nadie puede hacerse Admin.
- El análisis de seguridad automático no encuentra problemas.

## Riesgos encontrados y cómo los arreglo
1. **Familia de demostración compartida (el más importante).** Cualquier visitante puede escribir en ella. Si alguien añade el correo de una persona real, esa persona quedaría metida en la familia demo al registrarse, a la vista de todos.
   - Al entrar, una cuenta real nunca se une a la familia demo.
   - En la demo no se pueden cambiar correos ni teléfonos, ni subir documentos.
2. **Vincular cuentas a mano.** Un miembro de la familia podría enlazar la ficha de otro adulto a una cuenta cualquiera. A partir de ahora, solo el propio sistema hace ese enlace, cuando la persona entra con su correo.
3. **Consultar roles ajenos.** Hoy un usuario con sesión podría preguntar qué rol tiene otra persona (por ejemplo, quién es Admin). Lo limito para que cada uno solo pueda preguntar por sí mismo.
4. **Avisos al móvil.** Los códigos de aviso de cada móvil los ve toda la familia. Paso a que cada persona solo vea y borre los suyos.

## Fuera de esta revisión (decisión tuya, no lo cambio)
- Cualquier adulto de la familia puede editar o borrar a otros miembros e hijos.
- Soporte ve la lista de correos de todos los usuarios.

## Detalles técnicos
- Una migración con:
  - `link_me` ignora el hogar demo (`demo@runtheweek.app`, buscado por su `created_by`).
  - Un trigger en `family_members` que impide cambiar `user_id` desde los clientes y bloquea los cambios de email y teléfono en el hogar demo.
  - `has_role` devuelve false cuando `_user_id <> auth.uid()`; el servidor sigue usando su propia comprobación.
  - Una política de subida a storage que excluye el hogar demo.
  - Políticas de `push_tokens` limitadas al miembro dueño.
- Verifico con consultas SQL como usuario de la demo y como usuario normal, y vuelvo a pasar el análisis de seguridad.
