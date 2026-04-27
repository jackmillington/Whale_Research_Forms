import { deleteEntry, getEntries } from "./storage.js";
import { createThemeController } from "./theme.js";
import { escapeAttr, escapeHtml } from "./utils.js";

const KEY_FIELD_LABELS = {
  date: "Date",
  researcher: "Researcher",
  researchers: "Researchers",
  skipper: "Skipper",
  tour_time: "Tour time"
};

const theme = createThemeController();
let savedEntries = [];
let selectedFormId = "all";

document.addEventListener("DOMContentLoaded", initSavedEntriesPage);

async function initSavedEntriesPage() {
  theme.applyTheme(theme.readThemePreference());
  theme.bindThemeControls();
  theme.syncThemeControls();

  document.getElementById("saved-list")?.addEventListener("click", handleListClick);
  document.getElementById("form-filter")?.addEventListener("change", handleFormFilterChange);
  document.getElementById("export-csv")?.addEventListener("click", exportFilteredEntriesCsv);
  document.getElementById("export-json")?.addEventListener("click", exportJsonBackup);

  await renderSavedEntries();
}

async function renderSavedEntries() {
  const list = document.getElementById("saved-list");
  if (!list) {
    return;
  }

  setStatus("Loading saved entries...");

  try {
    savedEntries = await getEntries();
  } catch (error) {
    list.innerHTML = "";
    setStatus(`Could not load saved entries. ${error.message || "IndexedDB is unavailable."}`);
    return;
  }

  renderFormFilter();

  const visibleEntries = getVisibleEntries();
  if (savedEntries.length === 0) {
    list.innerHTML = '<div class="empty-state">No saved entries yet.</div>';
    setStatus("");
    return;
  }

  if (visibleEntries.length === 0) {
    list.innerHTML = '<div class="empty-state">No entries match this filter.</div>';
    setStatus(`${savedEntries.length} saved entr${savedEntries.length === 1 ? "y" : "ies"} total.`);
    return;
  }

  list.innerHTML = visibleEntries.map(renderEntryCard).join("");
  setStatus(`${visibleEntries.length} shown. ${savedEntries.length} saved entr${savedEntries.length === 1 ? "y" : "ies"} total.`);
}

function renderEntryCard(entry) {
  const keyFields = renderKeyFields(entry.data || {});
  const savedAt = formatTimestamp(entry.createdAt);

  return `
    <article class="saved-entry-card" data-entry-id="${escapeAttr(entry.id)}">
      <div class="saved-entry-main">
        <div>
          <h2>${escapeHtml(entry.formTitle || "Untitled form")}</h2>
          <p>Saved ${escapeHtml(savedAt)}</p>
        </div>
        <div class="saved-entry-actions">
          <button type="button" class="button-secondary" data-view-json="${escapeAttr(entry.id)}">View JSON</button>
          <button type="button" class="button-secondary" data-delete-entry="${escapeAttr(entry.id)}">Delete</button>
        </div>
      </div>
      ${keyFields}
      <pre class="saved-entry-json" data-entry-json="${escapeAttr(entry.id)}" hidden>${escapeHtml(JSON.stringify(entry, null, 2))}</pre>
    </article>
  `;
}

function renderFormFilter() {
  const filter = document.getElementById("form-filter");
  if (!filter) {
    return;
  }

  const previousSelection = selectedFormId;
  const formSummaries = getFormSummaries();
  filter.innerHTML = [
    `<option value="all">All forms (${savedEntries.length})</option>`,
    ...formSummaries.map(
      (summary) =>
        `<option value="${escapeAttr(summary.formId)}">${escapeHtml(summary.formTitle)} (${summary.count})</option>`
    )
  ].join("");

  selectedFormId = previousSelection === "all" || formSummaries.some((summary) => summary.formId === previousSelection)
    ? previousSelection
    : "all";
  filter.value = selectedFormId;
}

function renderKeyFields(data) {
  const items = Object.entries(KEY_FIELD_LABELS)
    .map(([key, label]) => {
      const value = formatDisplayValue(data[key]);
      return value ? `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>` : "";
    })
    .filter(Boolean)
    .join("");

  return items ? `<dl class="saved-entry-fields">${items}</dl>` : "";
}

async function handleListClick(event) {
  const viewButton = event.target.closest("[data-view-json]");
  if (viewButton) {
    toggleJson(viewButton.dataset.viewJson);
    return;
  }

  const deleteButton = event.target.closest("[data-delete-entry]");
  if (!deleteButton) {
    return;
  }

  const entryId = deleteButton.dataset.deleteEntry;
  const entry = savedEntries.find((item) => item.id === entryId);
  const title = entry?.formTitle || "this saved entry";
  if (!window.confirm(`Delete ${title}? This only removes the local saved copy in this browser.`)) {
    return;
  }

  deleteButton.disabled = true;

  try {
    await deleteEntry(entryId);
    setStatus("Entry deleted.");
    await renderSavedEntries();
  } catch (error) {
    deleteButton.disabled = false;
    setStatus(`Could not delete entry. ${error.message || "Try again."}`);
  }
}

function handleFormFilterChange(event) {
  selectedFormId = event.target.value || "all";
  renderSavedEntries();
}

function toggleJson(entryId) {
  const output = document.querySelector(`[data-entry-json="${cssEscape(entryId)}"]`);
  const button = document.querySelector(`[data-view-json="${cssEscape(entryId)}"]`);
  if (!output || !button) {
    return;
  }

  const nextHidden = !output.hidden;
  output.hidden = nextHidden;
  button.textContent = nextHidden ? "View JSON" : "Hide JSON";
}

function exportFilteredEntriesCsv() {
  const entries = getVisibleEntries();
  if (entries.length === 0) {
    setStatus("No saved entries to export for this filter.");
    return;
  }

  const metadataColumns = ["id", "formId", "formTitle", "schemaVersion", "createdAt", "updatedAt"];
  const dataColumns = getUniqueDataColumns(entries);
  const headers = [...metadataColumns, ...dataColumns.map((column) => `data.${column}`)];
  const rows = entries.map((entry) => [
    ...metadataColumns.map((column) => entry[column]),
    ...dataColumns.map((column) => entry.data?.[column])
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map(formatCsvCell).join(","))
    .join("\r\n");

  downloadTextFile(`${csvFilePrefix()}-${todayStamp()}.csv`, `\uFEFF${csv}`, "text/csv;charset=utf-8");
  setStatus(`Exported ${entries.length} entr${entries.length === 1 ? "y" : "ies"} to CSV.`);
}

function exportJsonBackup() {
  if (savedEntries.length === 0) {
    setStatus("No saved entries to export.");
    return;
  }

  downloadTextFile(
    `whale-research-forms-backup-${todayStamp()}.json`,
    JSON.stringify(savedEntries, null, 2),
    "application/json;charset=utf-8"
  );
  setStatus(`Exported ${savedEntries.length} saved entr${savedEntries.length === 1 ? "y" : "ies"} to JSON.`);
}

function getUniqueDataColumns(entries) {
  const columns = [];
  const seen = new Set();

  entries.forEach((entry) => {
    Object.keys(entry.data || {}).forEach((key) => {
      if (!seen.has(key)) {
        seen.add(key);
        columns.push(key);
      }
    });
  });

  return columns;
}

function getVisibleEntries() {
  if (selectedFormId === "all") {
    return savedEntries;
  }

  return savedEntries.filter((entry) => entry.formId === selectedFormId);
}

function getFormSummaries() {
  const summariesById = new Map();

  savedEntries.forEach((entry) => {
    const formId = entry.formId || "unknown";
    const existing = summariesById.get(formId);
    if (existing) {
      existing.count += 1;
      return;
    }

    summariesById.set(formId, {
      formId,
      formTitle: entry.formTitle || formId,
      count: 1
    });
  });

  return Array.from(summariesById.values()).sort((left, right) => left.formTitle.localeCompare(right.formTitle));
}

function csvFilePrefix() {
  if (selectedFormId === "all") {
    return "whale-research-forms";
  }

  const entry = savedEntries.find((item) => item.formId === selectedFormId);
  return slugForFilename(entry?.formTitle || selectedFormId);
}

function formatCsvCell(value) {
  const text = formatExportValue(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function formatExportValue(value) {
  if (value === undefined || value === null) {
    return "";
  }

  if (Array.isArray(value)) {
    return value.map(formatExportValue).join("; ");
  }

  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch (error) {
      return String(value);
    }
  }

  return String(value);
}

function formatDisplayValue(value) {
  return formatExportValue(value);
}

function formatTimestamp(value) {
  if (!value) {
    return "unknown time";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function downloadTextFile(filename, contents, type) {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function todayStamp() {
  return new Date().toISOString().slice(0, 10);
}

function slugForFilename(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "saved-entries";
}

function setStatus(message) {
  const status = document.getElementById("saved-status");
  if (status) {
    status.textContent = message;
  }
}

function cssEscape(value) {
  return String(value).replace(/"/g, '\\"');
}
