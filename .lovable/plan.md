# El tiempo directamente en el horario

## Qué verás en Schedule
- **Franja del tiempo arriba del horario**, debajo del título "Your week":
  - Si la familia aún no tiene ciudad: una tarjeta amable "See the weather for your week" con un campo "Your town or ZIP", el selector °F/°C y un botón **Save**. Ya no hace falta ir a Settings.
  - Con la ciudad puesta: una fila con los 7 días (icono, máxima/mínima), el nombre de la ciudad y un enlace pequeño **Change** para cambiarla ahí mismo.
- Se mantienen el tiempo junto a cada día y el aviso en cada actividad ("Rain likely — pack a raincoat").
- Settings conserva el mismo campo, por si alguien lo busca allí.

## Pendiente que no depende de esto
- La clave de Meteosource sigue siendo rechazada; hasta que la pegues bien, la franja mostrará "We couldn't reach the weather service — try again later" en lugar de romper nada.

## Detalles técnicos
- Nuevo componente `WeatherStrip` en `src/components/app/Weather.tsx`, reutilizando `weatherQuery` y `saveLocation`; se coloca en `src/routes/_authenticated/schedule.tsx` tras `Stats`.
- `saveLocation` devuelve error amable si el servicio rechaza la clave; el strip lo muestra en línea.
