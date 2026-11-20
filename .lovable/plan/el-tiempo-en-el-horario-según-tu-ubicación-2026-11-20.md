# El tiempo en el horario, según tu ubicación

## Qué verás en Schedule
- **Franja del tiempo arriba del horario**, debajo de "Your week", con los 7 días (icono, máxima/mínima) y el nombre del lugar.
- **Ubicación automática:** la primera vez, la franja muestra un botón **"Use my location"**. El navegador pregunta permiso una vez; al aceptar, la previsión se carga para donde estás y queda guardada para toda la familia.
- **Si no das permiso** (o el navegador no puede): la misma franja ofrece escribir la ciudad o el ZIP a mano.
- Un enlace pequeño **"Update location"** para volver a detectar dónde estás (por ejemplo, de vacaciones).
- Se mantienen el tiempo junto a cada día y el aviso en cada actividad ("Rain likely — pack a raincoat"). Settings conserva el campo manual.

## Pendiente que no depende de esto
- La clave de Meteosource sigue siendo rechazada; hasta que la pegues bien, la franja dirá "We couldn't reach the weather service — try again later" sin romper nada.

## Detalles técnicos
- Migración: añadir `lat` y `lon` (numeric, nullable) a `households`.
- `saveLocation` acepta `{ lat, lon }` además de texto; con coordenadas guarda `lat/lon`, pone `place_id` a null y obtiene un nombre legible vía `nearest_place` de Meteosource.
- `fetchForecast` usa `lat`/`lon` cuando existen (formato `30.27N`/`97.74W`) y `place_id` si no.
- Nuevo `WeatherStrip` en `src/components/app/Weather.tsx` con `navigator.geolocation.getCurrentPosition` (solo al pulsar el botón), insertado en `src/routes/_authenticated/schedule.tsx` tras `Stats`.
