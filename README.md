# Visualización Spiral Plot  — Concentración de NO₂ en Barcelona (2023–2025)

Visualización implementada para la PEC 2 de la asignatura Visualización de Datos de la Universitat Oberta de Catalunya (UOC).

## Motivación

Apliación de un Spiral Plot a partir de datos públicos.

## Objetivo

Mostrar la evolución de la concentración diaria de dióxido de nitrógeno (NO₂) en Barcelona-Eixample durante 2023, 2024 y 2025 con un Spiral Plot.

Representar una vuelta completa por año permite comparar periodos equivalentes y evidenciar posibles patrones estacionales, así como diferencias entre los tres años.

## Fuente de los datos

Generalitat de Catalunya — Xarxa de Vigilància i Previsió de la Contaminació Atmosfèrica (XVPCA). Conjunto de datos: Qualitat de l'aire als punts de mesurament automàtics.

Conjunto de datos: Qualitat de l'aire als punts de mesurament automàtics.

https://analisi.transparenciacatalunya.cat/d/tasf-thgu

- Estación: Barcelona-Eixample (08019043).
- Contaminante: NO₂.
- Periodo: 2023–2025.
- Resolución original: horaria.
- Variable representada: concentración media diaria (µg/m³).

## Uso local

Clona el repositorio y ejecuta desde la raiz:

```python
python3  -m http.server 8000
```

## Visualización online
 
Se puede acceder a la visualización online desde https://happohiken.github.io/uoc-vd-pec2-spiral-plot/

## Créditos y licencia

Adaptada del ejemplo Condegram Spiral Plot, de Arpit Narechania:

https://gist.github.com/arpitnarechania/027e163073864ef2ac4ceb5c2c0bf616

El código se distribuye bajo licencia MIT.