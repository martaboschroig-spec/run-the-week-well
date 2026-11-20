# Previsión del tiempo para organizar la semana

## Qué verán las familias
- **En el horario (Schedule):** junto a cada día, un icono del tiempo con máxima/mínima y probabilidad de lluvia.
- **En cada actividad:** el tiempo previsto a la hora de la actividad (ej. "Lluvia 70% · 12°C a las 5:00 PM").
- **Aviso útil:** si se espera lluvia, calor o frío en una actividad, aparece una nota amable tipo "Rain likely — pack a raincoat" para que se acuerden de llevar algo.
- **Ubicación de la familia:** en Settings, un campo "Your town or ZIP" para saber de dónde pedir el tiempo. Si una actividad tiene dirección propia, se usa la de la familia como referencia.
- Previsión para los próximos 7 días (lo que da la API gratuita). Días más lejanos no muestran tiempo.

## Qué necesito de ti
- Tu **clave de Meteosource** (te pediré que la pegues en un cuadro seguro; no queda en el código).

## Detalles técnicos
- Migración: columnas `location_label`, `lat`, `lon`, `units` (°F por defecto, mercado US) en `households`.
- Clave guardada como secreto `METEOSOURCE_API_KEY`; llamada solo desde servidor (`src/lib/weather.server.ts`) al endpoint `/point` con `sections=daily,hourly`, y `find_places` para convertir la ciudad en coordenadas.
- Server function `getWeather` (autenticada, por hogar) con caché de 1 hora en una tabla `weather_cache` para no gastar llamadas.
- Reglas puras ("¿hace falta chubasquero?", umbrales de lluvia/calor/frío) en `src/lib/domain/weather.ts` con tests Vitest.
- Si falta la clave o falla la API, la app sigue igual sin mostrar tiempo (nunca rompe el horario).
- UI: chip de tiempo en el Schedule y en la ficha de actividad, con la paleta alegre existente.
