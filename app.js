// AfroNLP Atlas — mock data + search/filter logic
// Replace ASSETS with real entries (or fetch from a JSON file / API) as the directory grows.

const ASSETS = [
  {
    name: "MasakhaNER 2.0",
    description:
      "Named entity recognition dataset spanning 20 African languages, annotated for person, location, organization and date entities.",
    languages: ["Yoruba", "Hausa", "Igbo", "Swahili", "Amharic"],
    task: "Dataset",
    source: "Masakhane",
    format: "CoNLL",
    url: "https://github.com/masakhane-io/masakhane-ner",
  },
  {
    name: "AfriBERTa",
    description:
      "Multilingual pre-trained language model trained from scratch on 11 African languages using only ~1GB of monolingual text.",
    languages: ["Hausa", "Yoruba", "Swahili", "Amharic"],
    task: "Pre-trained Model",
    source: "Castorini",
    format: "Hugging Face / PyTorch",
    url: "https://huggingface.co/castorini",
  },
  {
    name: "MAFAND-MT",
    description:
      "Machine translation benchmark and fine-tuned models for news-domain translation between English/French and 16 African languages.",
    languages: ["Yoruba", "Igbo", "Hausa", "Swahili"],
    task: "Machine Translation",
    source: "Masakhane",
    format: "Hugging Face",
    url: "https://github.com/masakhane-io/lafand-mt",
  },
  {
    name: "ALFFA Swahili Speech Corpus",
    description:
      "Open speech corpus for Swahili automatic speech recognition, with transcribed read-speech recordings from multiple speakers.",
    languages: ["Swahili"],
    task: "Speech-to-Text",
    source: "ALFFA Project",
    format: "WAV + transcripts",
    url: "https://github.com/getalp/ALFFA_PUBLIC",
  },
  {
    name: "Yoruba OpenSLR TTS Corpus",
    description:
      "Single-speaker text-to-speech dataset for Yoruba with studio-quality recordings and aligned transcripts for TTS model training.",
    languages: ["Yoruba"],
    task: "Text-to-Speech",
    source: "OpenSLR",
    format: "WAV + metadata.csv",
    url: "https://openslr.org/",
  },
  {
    name: "AfriSpeech-200",
    description:
      "200-hour pan-African accented English speech benchmark for evaluating ASR robustness across African accents and dialects.",
    languages: ["Swahili", "Hausa", "Igbo", "Yoruba", "Amharic"],
    task: "Benchmark",
    source: "Intron Health",
    format: "WAV + JSON metadata",
    url: "https://github.com/intron-innovation/AfriSpeech-Dataset",
  },
];

const TASK_TYPES = [
  "Dataset",
  "Pre-trained Model",
  "Benchmark",
  "Text-to-Speech",
  "Speech-to-Text",
  "Machine Translation",
];

const state = {
  query: "",
  language: "All",
  tasks: new Set(), // empty set = all tasks
};

const grid = document.getElementById("asset-grid");
const emptyState = document.getElementById("empty-state");
const resultsCount = document.getElementById("results-count");
const template = document.getElementById("card-template");
const languageSelect = document.getElementById("language-filter");
const taskFilters = document.getElementById("task-filters");
const searchInput = document.getElementById("search-input");
const resetBtn = document.getElementById("reset-filters");

function uniqueLanguages() {
  const set = new Set();
  ASSETS.forEach((a) => a.languages.forEach((l) => set.add(l)));
  return Array.from(set).sort();
}

function buildLanguageOptions() {
  uniqueLanguages().forEach((lang) => {
    const opt = document.createElement("option");
    opt.value = lang;
    opt.textContent = lang;
    languageSelect.appendChild(opt);
  });
}

function buildTaskFilters() {
  TASK_TYPES.forEach((task) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = task;
    btn.className = "task-filter-btn";
    btn.setAttribute("aria-pressed", "false");
    btn.addEventListener("click", () => {
      if (state.tasks.has(task)) {
        state.tasks.delete(task);
        btn.classList.remove("active");
        btn.setAttribute("aria-pressed", "false");
      } else {
        state.tasks.add(task);
        btn.classList.add("active");
        btn.setAttribute("aria-pressed", "true");
      }
      render();
    });
    taskFilters.appendChild(btn);
  });
}

function matchesFilters(asset) {
  const q = state.query.trim().toLowerCase();
  const matchesQuery =
    q === "" ||
    asset.name.toLowerCase().includes(q) ||
    asset.description.toLowerCase().includes(q) ||
    asset.source.toLowerCase().includes(q) ||
    asset.languages.some((l) => l.toLowerCase().includes(q));

  const matchesLanguage =
    state.language === "All" || asset.languages.includes(state.language);

  const matchesTask = state.tasks.size === 0 || state.tasks.has(asset.task);

  return matchesQuery && matchesLanguage && matchesTask;
}

function renderCard(asset) {
  const node = template.content.cloneNode(true);
  const card = node.querySelector(".asset-card");
  card.setAttribute("data-task", asset.task);

  node.querySelector(".asset-name").textContent = asset.name;
  node.querySelector(".task-badge").textContent = asset.task;
  node.querySelector(".asset-desc").textContent = asset.description;
  node.querySelector(".asset-source").textContent = asset.source;
  node.querySelector(".asset-format").textContent = asset.format;

  const link = node.querySelector(".asset-link");
  link.href = asset.url;

  const langTagsContainer = node.querySelector(".lang-tags");
  asset.languages.forEach((lang) => {
    const span = document.createElement("span");
    span.className = "lang-tag";
    span.textContent = lang;
    langTagsContainer.appendChild(span);
  });

  return node;
}

function render() {
  const filtered = ASSETS.filter(matchesFilters);

  grid.innerHTML = "";
  filtered.forEach((asset) => grid.appendChild(renderCard(asset)));

  const count = filtered.length;
  resultsCount.textContent = `${count} asset${count === 1 ? "" : "s"} found`;

  grid.classList.toggle("hidden", count === 0);
  emptyState.classList.toggle("hidden", count !== 0);
}

function resetFilters() {
  state.query = "";
  state.language = "All";
  state.tasks.clear();

  searchInput.value = "";
  languageSelect.value = "All";
  document
    .querySelectorAll(".task-filter-btn")
    .forEach((btn) => {
      btn.classList.remove("active");
      btn.setAttribute("aria-pressed", "false");
    });

  render();
}

searchInput.addEventListener("input", (e) => {
  state.query = e.target.value;
  render();
});

languageSelect.addEventListener("change", (e) => {
  state.language = e.target.value;
  render();
});

resetBtn.addEventListener("click", resetFilters);

// init
buildLanguageOptions();
buildTaskFilters();
document.getElementById("stat-count").textContent = ASSETS.length;
render();
