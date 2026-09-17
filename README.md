# NLP-Cartographer

NLP-Cartographer is a community-driven, interactive platform for mapping the state of African NLP resources across languages, tasks, and regions. The project is designed to make visible what exists, what is missing, and where attention is most needed in the African NLP ecosystem.

## Why this project exists

African languages are often underrepresented in the global NLP landscape. Many datasets, benchmarks, models, and research outputs exist across scattered repositories, papers, and community channels, but they are rarely assembled into one place in a way that makes the real gaps obvious.

This leads to a few problems:

- Researchers duplicate effort because they do not know what already exists.
- Funders and collaborators focus on visible work instead of the most urgent gaps.
- Language communities cannot easily see which languages are untouched, under-resourced, or well covered.
- The field grows unevenly because the map of progress is fragmented and hard to interpret.

NLP-Cartographer aims to solve that by turning fragmented resources into an explorable, searchable, and structured view of the African NLP landscape.

## Project vision

The vision is to build an open-source, interactive sandbox for African NLP that helps the community answer questions such as:

- Which African languages already have datasets or benchmarks?
- Which languages remain untouched across key NLP tasks?
- Which tasks are underdeveloped in specific countries or regions?
- Which endangered languages are also resource-poor?
- Where should researchers, funders, and contributors focus next?

This is not only a directory. It is a diagnostic and discovery layer for the field.

## Core concept: a label-based sandbox system

The platform treats resources as a structured system of labels rather than a flat list.

Each language can be evaluated across NLP tasks such as:

- machine translation
- speech recognition
- text-to-speech
- named entity recognition
- sentiment analysis
- language identification
- and more

For each language-task pair, the system assigns a status label such as:

- untouched: no dataset or benchmark exists
- dataset_only: data exists but no benchmark has been run
- benchmark_only: benchmark exists without a corresponding native dataset
- covered: both dataset and benchmark exist

Additional labels allow users to filter and combine results by:

- geography (country, region, continent)
- endangerment status
- task type
- language family
- community-defined categories

This creates a sandbox where users can search broadly, then narrow down results using labels to find the exact slice of the field they care about.

## Search + filter model

The platform will support both broad search and precise narrowing:

- A general search lets users look for a language, task, model, or dataset name.
- Labels then narrow the result set by status, geography, task, or endangerment.
- The map and list views should reflect the same filtered result set so users can switch between exploration modes without losing context.

This makes the system useful for both:

- people who already know what they are looking for
- people who are exploring the space to discover gaps and opportunities

## Why this matters for African NLP

The goal is not just to catalog resources. The goal is to make the real state of African NLP visible.

By surfacing gaps and coverage patterns, the platform can help:

- researchers avoid duplicated effort
- students discover relevant language resources
- communities identify where data collection is most urgent
- funders direct support to under-served languages and tasks
- the continent build a more evidence-based NLP agenda

## Community-driven and open by design

This project is intended to be a community-owned effort that complements existing work in the ecosystem rather than duplicating it. It should remain open-source and open to contributions from researchers, students, and practitioners.

To keep the taxonomy clean and useful, labels should be controlled and moderated rather than completely free-form. Community contributions can add labels through a guided workflow, while structured core labels remain stable and reliable for the system's dashboard, filters, and insights.

## High-level MVP scope

For the first version, the project can focus on proving the core idea:

- a searchable, interactive view of African NLP resources
- label-driven coverage status across languages and tasks
- map and list toggles using the same filtered data
- basic metadata indexing and source discovery
- community contribution flow for new resources and labels

This should be enough to validate the concept without needing a full, large-scale ingest system from day one.

## Tech direction

This repo is currently structured as a static frontend prototype to demonstrate the concept visually. The long-term idea is a lightweight backend and database layer that supports:

- live filtering
- metadata indexing
- label-based status calculation
- submissions and moderation
- map/list rendering from the same query source

The MVP should remain light and easy to deploy while still proving the core sandbox mechanism works.

## Project structure

```bash
.
├── index.html
├── style.css
├── app.js
├── data/
│   └── database.json
├── README.md
└── LICENSE
```

## Local development

You can run the site locally with a simple web server:

```bash
cd afronlp-atlas.github.io
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Contributing

Contributions are welcome from anyone interested in African NLP, language resources, data visibility, or web-based research tools.

If you want to help:

- add missing language-resource entries
- improve the filtering and labeling logic
- refine the UI for map/list exploration
- suggest better taxonomy or coverage categories
- help shape the platform around the real needs of the African NLP community

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

## Summary

NLP-Cartographer is a community project to make the African NLP landscape visible, searchable, and actionable. It aims to reveal both what exists and what is still missing, so researchers, communities, and funders can work from evidence instead of scattered fragments.
