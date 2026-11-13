# Exercise library

The strength exercise library of OpenAthlete is built from two open sources.
`scripts/exercises/build-catalog.mjs` generates these files from them.

## Drawings: `media/*.svg`

Drawings by **Everkinetic** (Greg Priday), https://github.com/everkinetic/data,
licensed under the
[Creative Commons Attribution-ShareAlike 4.0 International](https://creativecommons.org/licenses/by-sa/4.0/)
licence (CC BY-SA 4.0).

Changes made by OpenAthlete: white background removed, lines recoloured to
`currentColor` so they follow the light and dark themes, numbers rounded and
files renamed after the exercises. The changed drawings are shared under the
same licence.

## Exercise data: `catalog.*.json`

Names, muscles, equipment and instructions from
**hasaneyldrm/exercises-dataset**, https://github.com/hasaneyldrm/exercises-dataset,
MIT licence (Copyright (c) 2026 Hasan Emir Yıldırım). Its media are © Gym visual
and are not used here.

Names in six languages, Brazilian Portuguese and German instructions, the matching
between the two sources and the exercises left out are OpenAthlete's own work
(`scripts/exercises/data`), under the licence of this repository.
