import {
  dependencyAttributes,
  escapeAttr,
  escapeHtml,
  inputId,
  inputNameForCompositeField,
  isDetailField,
  isWideField,
  joinAttributes,
  placeholderAttribute,
  requiredAttribute,
  slugify
} from "./utils.js";

/* Landing and page-level markup helpers. */

export function buildLandingCards(forms) {
  return forms
    .map(
      (form) => `
        <a class="form-card" href="${form.file}">
          <div class="card-top">
            <h3>${escapeHtml(form.title)}</h3>
          </div>
          <span class="card-cta">Open sheet</span>
        </a>
      `
    )
    .join("");
}

export function buildFormPageMarkup(formConfig, orderedForms) {
  return `
    <header class="topbar">
      <a class="brand" href="index.html">
        <span class="brand-mark">WF</span>
        <span class="brand-copy">
          <strong>${escapeHtml(formConfig.title)}</strong>
        </span>
      </a>
      <div class="topbar-actions">
        <nav class="top-links">
          <a href="index.html">All forms</a>
        </nav>
        ${renderThemeSwitcher()}
      </div>
    </header>

    <div class="page-layout">
      <aside class="sidebar">
        <section class="sidebar-card">
          <h2>Forms</h2>
          <div class="sidebar-links">
            ${renderSidebarLinks(orderedForms, formConfig.id)}
          </div>
        </section>
      </aside>

      <main class="main-panel">
        <section class="page-header">
          <h1>${escapeHtml(formConfig.title)}</h1>
          <p>${escapeHtml(formConfig.description)}</p>
        </section>

        <form class="form-shell" id="workbook-form" novalidate>
          <div class="sections-stack">
            ${formConfig.sections.map(renderSection).join("")}
          </div>

          <div class="form-actions">
            <button type="submit" class="button-primary">Validate and preview JSON</button>
            <button type="reset" class="button-secondary">Reset form</button>
          </div>

          <section class="preview-card">
            <div class="preview-head">
              <h2>Preview</h2>
              <p>Current form data.</p>
            </div>
            <pre class="preview-output" id="preview-output">Submit the form to preview the structured payload.</pre>
          </section>
        </form>
      </main>
    </div>
  `;
}

function renderSidebarLinks(forms, activeFormId) {
  return forms
    .map(
      (form) =>
        `<a class="${form.id === activeFormId ? "is-active" : ""}" href="${form.file}">${escapeHtml(form.title)}</a>`
    )
    .join("");
}

function renderThemeSwitcher() {
  return `
    <div class="theme-switcher" role="group" aria-label="Color theme">
      <button type="button" class="theme-switcher-button" data-theme-option="light" aria-pressed="false">Light</button>
      <button type="button" class="theme-switcher-button" data-theme-option="dark" aria-pressed="false">Dark</button>
    </div>
  `;
}

/* Section and field renderers keep config-driven markup in one place. */

export function renderSection(section) {
  return section.repeatable ? renderRepeatableSection(section) : renderStandardSection(section);
}

function renderRepeatableSection(section) {
  const repeatable = section.repeatable;
  return `
    <section class="form-section section-repeatable" ${dependencyAttributes(section.dependsOn)}>
      ${renderSectionHeader(section.title, section.description)}
      <div
        class="repeatable-list"
        data-repeatable-list="${repeatable.key}"
        data-item-label="${escapeHtml(repeatable.itemLabel)}"
        data-min-items="${repeatable.min || 1}"
      >
        ${renderRepeatableCard(repeatable, 0)}
      </div>
      <div class="repeatable-actions">
        <button type="button" class="button-secondary repeatable-add" data-repeatable-add="${repeatable.key}">
          ${escapeHtml(repeatable.addLabel || "Add")}
        </button>
      </div>
    </section>
  `;
}

function renderStandardSection(section) {
  return `
    <section class="form-section" ${dependencyAttributes(section.dependsOn)}>
      ${renderSectionHeader(section.title, section.description)}
      <div class="field-grid">
        ${section.fields.map((field) => renderField(field)).join("")}
      </div>
    </section>
  `;
}

function renderSectionHeader(title, description, actionMarkup) {
  return `
    <div class="section-head">
      <div>
        <h2>${escapeHtml(title)}</h2>
      </div>
      ${actionMarkup || ""}
    </div>
  `;
}

export function renderRepeatableCard(repeatable, index) {
  const prefix = `${repeatable.key}[${index}]`;
  return `
    <article class="repeatable-card" data-repeatable-item="${repeatable.key}">
      <div class="repeatable-card-head">
        <h3>${escapeHtml(repeatable.itemLabel)} ${index + 1}</h3>
        <button type="button" class="button-link repeatable-remove" data-repeatable-remove="${repeatable.key}">Remove</button>
      </div>
      <div class="field-grid">
        ${repeatable.fields.map((field) => renderField(field, prefix)).join("")}
      </div>
    </article>
  `;
}

export function renderField(field, prefix) {
  const fieldName = prefix ? `${prefix}.${field.key}` : field.key;
  if (isDetailField(field)) {
    return renderDetailField(field, fieldName);
  }

  const classes = ["field"];
  if (isWideField(field)) {
    classes.push("field--wide");
  }
  if (field.type !== "textarea") {
    classes.push("field--inline");
  }

  return `
    <div class="${classes.join(" ")}" data-field-wrapper="${fieldName}" ${dependencyAttributes(field.dependsOn)}>
      <label for="${escapeAttr(inputId(fieldName))}">${escapeHtml(field.label)}</label>
      ${renderFieldControl(field, fieldName)}
    </div>
  `;
}

function renderDetailField(field, fieldName) {
  const detailClasses = ["field", "field--wide", "field-detail"];
  if (field.type === "details-number") {
    detailClasses.push("field-detail--number");
  }

  return `
    <div
      class="${detailClasses.join(" ")}"
      data-field-wrapper="${fieldName}"
      ${dependencyAttributes({ field: field.sourceField, hasAny: true })}
    >
      <label>${escapeHtml(field.label)}</label>
      <div class="detail-list" data-detail-list="${field.sourceField}" data-detail-name="${fieldName}" data-detail-type="${field.type}">
        <p class="detail-placeholder">Select one or more values above to reveal details.</p>
      </div>
    </div>
  `;
}

function renderFieldControl(field, fieldName) {
  if (field.repeatable) {
    return renderRepeatableFieldControl(field, fieldName);
  }

  switch (field.type) {
    case "textarea":
      return renderTextarea(field, fieldName);
    case "gps":
      return renderGpsField(field, fieldName);
    case "select":
      return renderSelect(field, fieldName);
    case "radio":
      return renderRadioGroup(field, fieldName);
    case "checkbox-group":
      return renderCheckboxGroup(field, fieldName);
    default:
      return renderBasicInput(field, fieldName);
  }
}

export function renderRepeatableFieldControl(field, fieldName) {
  if (field.type === "text") {
    return renderRepeatableTokenFieldControl(field, fieldName);
  }

  const items = [];
  for (let index = 0; index < field.repeatable.min; index += 1) {
    items.push(renderRepeatableFieldItem(field, fieldName, index));
  }

  const addButton =
    field.repeatable.max > field.repeatable.min
      ? `<button
          type="button"
          class="button-link inline-symbol-button add-inline"
          data-repeatable-field-add="${fieldName}"
          aria-label="Add ${escapeAttr(field.repeatable.itemLabel)}"
        >+</button>`
      : "";

  return `
    <div class="repeatable-field-shell">
      <div class="stack-list" data-repeatable-field="${fieldName}" data-repeatable-min="${field.repeatable.min}" data-repeatable-max="${field.repeatable.max}">
        ${items.join("")}
      </div>
      ${addButton}
    </div>
  `;
}

function renderRepeatableTokenFieldControl(field, fieldName) {
  return `
    <div class="repeatable-token-field">
      <div class="repeatable-token-shell">
        <div class="repeatable-token-list" data-repeatable-chip-list="${fieldName}"></div>
        <input
          id="${escapeAttr(inputId(`${fieldName}__entry`))}"
          class="repeatable-token-input"
          type="text"
          data-repeatable-field-input="${fieldName}"
          placeholder="${escapeAttr(field.repeatable.max > 1 ? "Type & Press Enter" : `Type ${field.repeatable.itemLabel}`)}"
          aria-label="Add ${escapeAttr(field.repeatable.itemLabel)}"
        >
      </div>
      <div
        class="repeatable-token-hidden"
        data-repeatable-field="${fieldName}"
        data-repeatable-mode="chips"
        data-repeatable-min="${field.repeatable.min}"
        data-repeatable-max="${field.repeatable.max}"
      ></div>
    </div>
  `;
}

function renderTextarea(field, fieldName) {
  return `<textarea ${joinAttributes([
    `id="${escapeAttr(inputId(fieldName))}"`,
    `name="${escapeAttr(fieldName)}"`,
    requiredAttribute(field.required),
    field.maxLength ? `maxlength="${field.maxLength}"` : "",
    placeholderAttribute(field)
  ])}></textarea>`;
}

function renderGpsField(field, fieldName) {
  const latitudeName = inputNameForCompositeField(fieldName, field.latitudeKey || `${fieldName}_latitude`);
  const longitudeName = inputNameForCompositeField(fieldName, field.longitudeKey || `${fieldName}_longitude`);

  return `
    <div class="gps-input-group">
      <input ${joinAttributes([
        `id="${escapeAttr(inputId(latitudeName))}"`,
        `name="${escapeAttr(latitudeName)}"`,
        'type="number"',
        `min="${field.latitudeMin !== undefined ? field.latitudeMin : -90}"`,
        `max="${field.latitudeMax !== undefined ? field.latitudeMax : 90}"`,
        `step="${field.latitudeStep !== undefined ? field.latitudeStep : "any"}"`,
        `placeholder="${escapeAttr(field.latitudePlaceholder || "Latitude")}"`,
        `aria-label="${escapeAttr(`${field.label} latitude`)}"`,
        requiredAttribute(field.required)
      ])}>
      <input ${joinAttributes([
        `id="${escapeAttr(inputId(longitudeName))}"`,
        `name="${escapeAttr(longitudeName)}"`,
        'type="number"',
        `min="${field.longitudeMin !== undefined ? field.longitudeMin : -180}"`,
        `max="${field.longitudeMax !== undefined ? field.longitudeMax : 180}"`,
        `step="${field.longitudeStep !== undefined ? field.longitudeStep : "any"}"`,
        `placeholder="${escapeAttr(field.longitudePlaceholder || "Longitude")}"`,
        `aria-label="${escapeAttr(`${field.label} longitude`)}"`,
        requiredAttribute(field.required)
      ])}>
    </div>
  `;
}

function renderSelect(field, fieldName) {
  const placeholderText = field.selectPlaceholder || "Please select...";
  return `
    <select id="${escapeAttr(inputId(fieldName))}" name="${escapeAttr(fieldName)}" ${requiredAttribute(field.required)}>
      <option value="" selected disabled>${escapeHtml(placeholderText)}</option>
      ${(field.options || []).map((option) => `<option value="${escapeAttr(option)}">${escapeHtml(option)}</option>`).join("")}
    </select>
  `;
}

function renderRadioGroup(field, fieldName) {
  return `
    <div class="option-list option-list-inline" role="radiogroup" aria-label="${escapeAttr(field.label)}">
      ${(field.options || [])
        .map(
          (option, index) => `
            <label class="option-chip">
              <input
                type="radio"
                name="${escapeAttr(fieldName)}"
                value="${escapeAttr(option)}"
                ${field.required === "Y" ? "required" : ""}
                ${index > 0 && field.required === "Y" ? 'data-group-required="true"' : ""}
              >
              <span>${escapeHtml(option)}</span>
            </label>
          `
        )
        .join("")}
    </div>
  `;
}

function renderCheckboxGroup(field, fieldName) {
  return `
    <div class="option-list">
      ${(field.options || [])
        .map(
          (option) => `
            <div class="option-stack" data-option-stack="${escapeAttr(option)}">
              <label class="option-chip">
                <input type="checkbox" name="${escapeAttr(fieldName)}" value="${escapeAttr(option)}">
                <span>${escapeHtml(option)}</span>
              </label>
            </div>
          `
        )
        .join("")}
    </div>
  `;
}

function renderBasicInput(field, fieldName) {
  const type = ["date", "time", "number"].includes(field.type) ? field.type : "text";
  return `<input ${joinAttributes([
    `id="${escapeAttr(inputId(fieldName))}"`,
    `name="${escapeAttr(fieldName)}"`,
    `type="${type}"`,
    requiredAttribute(field.required),
    field.min !== undefined ? `min="${field.min}"` : "",
    field.max !== undefined ? `max="${field.max}"` : "",
    field.step !== undefined ? `step="${field.step}"` : "",
    field.maxLength ? `maxlength="${field.maxLength}"` : "",
    placeholderAttribute(field),
    field.defaultValue !== undefined ? `value="${escapeAttr(String(field.defaultValue))}"` : "",
    field.readOnly ? "readonly" : ""
  ])}>`;
}

export function renderRepeatableFieldItem(field, fieldName, index) {
  const itemName = `${fieldName}[${index}]`;
  const removeButton =
    field.repeatable.max > field.repeatable.min && index >= field.repeatable.min
      ? renderRepeatableFieldRemoveButton(fieldName, field.repeatable.itemLabel)
      : "";

  return `
    <div class="stack-item">
      <input
        id="${escapeAttr(inputId(itemName))}"
        name="${escapeAttr(itemName)}"
        type="text"
        ${index < field.repeatable.min && field.required === "Y" ? "required" : ""}
        ${field.required === "Y" ? 'placeholder="Required"' : ""}
      >
      ${removeButton}
    </div>
  `;
}

/* Detail controls are generated on demand from checkbox selections. */

export function renderDetailItem(detailType, detailFieldName, option, index, options, currentValue) {
  if (detailType === "details-number") {
    return `
      <div class="detail-item detail-item--number">
        <label for="${escapeAttr(inputId(`${detailFieldName}[${index}]`))}">${escapeHtml(option)}</label>
        <input
          id="${escapeAttr(inputId(`${detailFieldName}[${index}]`))}"
          name="${escapeAttr(`${detailFieldName}.${slugify(option)}`)}"
          type="number"
          min="0"
          step="1"
          ${currentValue ? `value="${escapeAttr(currentValue)}"` : ""}
        >
      </div>
    `;
  }

  return `
    <div class="detail-item">
      <label for="${escapeAttr(inputId(`${detailFieldName}[${index}]`))}">${escapeHtml(option)} condition</label>
      <select id="${escapeAttr(inputId(`${detailFieldName}[${index}]`))}" name="${escapeAttr(`${detailFieldName}.${slugify(option)}`)}">
        <option value="" ${currentValue ? "disabled" : "selected disabled"}>Please select...</option>
        ${options
          .map(
            (item) =>
              `<option value="${escapeAttr(item)}" ${currentValue === item ? "selected" : ""}>${escapeHtml(item)}</option>`
          )
          .join("")}
      </select>
    </div>
  `;
}

export function renderInlineDetailNumberItem(detailFieldName, option, index, currentValue, width) {
  return `
    <div class="option-detail-number" data-inline-detail-number="${escapeAttr(option)}" style="width: ${escapeAttr(String(width))}px;">
      <input
        id="${escapeAttr(inputId(`${detailFieldName}[${index}]`))}"
        name="${escapeAttr(`${detailFieldName}.${slugify(option)}`)}"
        type="number"
        min="0"
        step="1"
        required
        placeholder="Required"
        aria-label="${escapeAttr(`${option} amount`)}"
        ${currentValue ? `value="${escapeAttr(currentValue)}"` : ""}
      >
    </div>
  `;
}

export function renderRepeatableFieldRemoveButton(fieldName, itemLabel) {
  return `<button type="button" class="button-link inline-symbol-button remove-inline" data-repeatable-field-remove="${fieldName}" aria-label="Remove ${escapeAttr(itemLabel)}">-</button>`;
}
