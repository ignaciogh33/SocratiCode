# Memoria del TFG - SocratiCode

Carpeta con todos los ficheros LaTeX necesarios para la redacción de la memoria del TFG.

## Estructura de ficheros

| Fichero | Descripción |
|---|---|
| `memoria.tex` | **Fichero principal** - Compilar este fichero |
| `introduccion.tex` | Cap. 1: Motivación, objetivos, estructura |
| `estado_arte.tex` | Cap. 2: Método socrático, IA en educación, LLMs, prompt engineering |
| `diseno.tex` | Cap. 3: Requisitos, arquitectura, system prompt, modelo de datos, UI |
| `implementacion.tex` | Cap. 4: Frontend, backend, integración LLM, pruebas |
| `conclusiones.tex` | Cap. 5: Cumplimiento de objetivos, lecciones, trabajo futuro |
| `resumen.tex` | Resumen en español |
| `abstract.tex` | Abstract en inglés |
| `agradecimientos.tex` | Agradecimientos |
| `prefacio.tex` | Prefacio (opcional) |
| `bibliografia.bib` | Referencias bibliográficas (BibTeX) |

## Cómo compilar

Desde la carpeta `docs/`:

```bash
pdflatex -shell-escape memoria/memoria.tex
makeglossaries memoria/memoria
makeindex -s tfgtfmthesisuam.ist memoria/memoria.idx
bibtex memoria/memoria
pdflatex -shell-escape memoria/memoria.tex
pdflatex -shell-escape memoria/memoria.tex
```

O si usas **arara**: `arara memoria/memoria.tex`

## Cómo empezar a escribir

Cada fichero `.tex` contiene comentarios `% TODO:` que indican qué secciones hay que redactar. Busca los TODOs y ve rellenando capítulo por capítulo.
