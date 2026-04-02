(function () {
  const forms = window.WHALE_FORMS || [];
  const formsById = Object.fromEntries(forms.map((form) => [form.id, form]));
  const THEME_STORAGE_KEY = "whale-forms-theme";
  const DEFAULT_THEME = "dark";
  const THEMES = new Set(["light", "dark"]);

  document.addEventListener("DOMContentLoaded", initApp);

  function initApp() {
    applyTheme(readThemePreference());
    bindThemeControls();

    const mode = document.body.dataset.app;
    if (mode === "landing") {
      renderLandingPage();
    } else if (mode === "form") {
      renderFormPage(document.body.dataset.formId);
    }

    syncThemeControls();
  }

  function renderLandingPage() {
    const grid = document.getElementById("forms-grid");
    if (!grid) {
      return;
    }

    grid.innerHTML = forms
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

  function renderFormPage(formId) {
    const formConfig = formsById[formId];
    const root = document.getElementById("form-page-root");
    if (!formConfig || !root) {
      return;
    }

    root.innerHTML = buildFormPageMarkup(formConfig);

    const formEl = document.getElementById("workbook-form");
    initializeForm(formEl);
  }

  function buildFormPageMarkup(formConfig) {
    return `
      <header class="topbar">
        <a class="brand" href="index.html">
          <span class="brand-mark">WF</span>
          <span class="brand-copy">
            <strong>${escapeHtml(formConfig.title)}</strong>
            <span>${escapeHtml(formConfig.workbookSheet)}</span>
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
              ${renderSidebarLinks(formConfig.id)}
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

  function renderSidebarLinks(activeFormId) {
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

  function bindThemeControls() {
    document.addEventListener("click", (event) => {
      const themeButton = event.target.closest("[data-theme-option]");
      if (!themeButton) {
        return;
      }

      applyTheme(themeButton.dataset.themeOption);
    });
  }

  function applyTheme(theme) {
    const nextTheme = THEMES.has(theme) ? theme : DEFAULT_THEME;
    document.documentElement.dataset.theme = nextTheme;
    document.body.dataset.theme = nextTheme;

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch (error) {
      // Ignore storage failures and continue with the in-memory theme.
    }

    syncThemeControls();
  }

  function readThemePreference() {
    try {
      const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
      return THEMES.has(savedTheme) ? savedTheme : DEFAULT_THEME;
    } catch (error) {
      return DEFAULT_THEME;
    }
  }

  function syncThemeControls() {
    const activeTheme = document.body.dataset.theme || DEFAULT_THEME;

    document.querySelectorAll("[data-theme-option]").forEach((button) => {
      const isActive = button.dataset.themeOption === activeTheme;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
  }

  function renderSection(section) {
    return section.repeatable ? renderRepeatableSection(section) : renderStandardSection(section);
  }

  function renderRepeatableSection(section) {
    const repeatable = section.repeatable;
    return `
      <section class="form-section section-repeatable" ${dependencyAttributes(section.dependsOn)}>
        ${renderSectionHeader(
          section.title,
          section.description,
          `<button type="button" class="button-secondary repeatable-add" data-repeatable-add="${repeatable.key}">
            ${escapeHtml(repeatable.addLabel || "Add")}
          </button>`
        )}
        <div
          class="repeatable-list"
          data-repeatable-list="${repeatable.key}"
          data-item-label="${escapeHtml(repeatable.itemLabel)}"
          data-min-items="${repeatable.min || 1}"
        >
          ${renderRepeatableCard(repeatable, 0)}
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
          ${description ? `<p>${escapeHtml(description)}</p>` : ""}
        </div>
        ${actionMarkup || ""}
      </div>
    `;
  }

  function renderRepeatableCard(repeatable, index) {
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

  function renderField(field, prefix) {
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
    return `
      <div
        class="field field--wide field-detail"
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
      case "checkbox":
        return renderCheckbox(fieldName);
      default:
        return renderBasicInput(field, fieldName);
    }
  }

  function renderRepeatableFieldControl(field, fieldName) {
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
    return `
      <select id="${escapeAttr(inputId(fieldName))}" name="${escapeAttr(fieldName)}" ${requiredAttribute(field.required)}>
        <option value="">${field.required === "Y" ? "Required" : "Select..."}</option>
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
              <label class="option-chip">
                <input type="checkbox" name="${escapeAttr(fieldName)}" value="${escapeAttr(option)}">
                <span>${escapeHtml(option)}</span>
              </label>
            `
          )
          .join("")}
      </div>
    `;
  }

  function renderCheckbox(fieldName) {
    return `
      <label class="toggle">
        <input id="${escapeAttr(inputId(fieldName))}" name="${escapeAttr(fieldName)}" type="checkbox">
        <span>Yes</span>
      </label>
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

  function renderRepeatableFieldItem(field, fieldName, index) {
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

  function initializeForm(formEl) {
    initializeRepeatableSections(formEl);
    initializeRepeatableFields(formEl);
    syncConditionalState(formEl);
    bindFormEvents(formEl);
  }

  function bindFormEvents(formEl) {
    formEl.addEventListener("click", (event) => handleFormClick(formEl, event));
    formEl.addEventListener("change", () => syncConditionalState(formEl));
    formEl.addEventListener("submit", (event) => handleFormSubmit(formEl, event));
    formEl.addEventListener("reset", () => {
      window.setTimeout(() => {
        resetRepeatableStructures(formEl);
        syncConditionalState(formEl);
        document.getElementById("preview-output").textContent = "Submit the form to preview the structured payload.";
      }, 0);
    });
  }

  function handleFormClick(formEl, event) {
    if (handleRepeatableSectionAdd(formEl, event)) {
      return;
    }
    if (handleRepeatableSectionRemove(formEl, event)) {
      return;
    }
    if (handleRepeatableFieldAdd(formEl, event)) {
      return;
    }
    handleRepeatableFieldRemove(formEl, event);
  }

  function handleRepeatableSectionAdd(formEl, event) {
    const addButton = event.target.closest("[data-repeatable-add]");
    if (!addButton) {
      return false;
    }

    const repeatableKey = addButton.dataset.repeatableAdd;
    const list = formEl.querySelector(`[data-repeatable-list="${repeatableKey}"]`);
    const section = getCurrentFormConfig().sections.find((item) => item.repeatable && item.repeatable.key === repeatableKey);
    const index = list.querySelectorAll(`[data-repeatable-item="${repeatableKey}"]`).length;

    list.insertAdjacentHTML("beforeend", renderRepeatableCard(section.repeatable, index));
    updateRepeatableHeadings(list, repeatableKey);
    syncConditionalState(formEl);
    return true;
  }

  function handleRepeatableSectionRemove(formEl, event) {
    const removeButton = event.target.closest("[data-repeatable-remove]");
    if (!removeButton) {
      return false;
    }

    const repeatableKey = removeButton.dataset.repeatableRemove;
    const list = removeButton.closest(`[data-repeatable-list="${repeatableKey}"]`);
    const items = list.querySelectorAll(`[data-repeatable-item="${repeatableKey}"]`);
    const minItems = Number(list.dataset.minItems || 1);

    if (items.length > minItems) {
      removeButton.closest(`[data-repeatable-item="${repeatableKey}"]`).remove();
      updateRepeatableHeadings(list, repeatableKey);
      syncConditionalState(formEl);
    }
    return true;
  }

  function handleRepeatableFieldAdd(formEl, event) {
    const addButton = event.target.closest("[data-repeatable-field-add]");
    if (!addButton) {
      return false;
    }

    const fieldName = addButton.dataset.repeatableFieldAdd;
    const container = formEl.querySelector(`[data-repeatable-field="${cssEscape(fieldName)}"]`);
    const maxItems = Number(container.dataset.repeatableMax || 1);
    const currentCount = container.querySelectorAll(".stack-item").length;
    if (currentCount >= maxItems) {
      return true;
    }

    const fieldConfig = findFieldConfigByName(getCurrentFormConfig(), fieldName);
    container.insertAdjacentHTML("beforeend", renderRepeatableFieldItem(fieldConfig, fieldName, currentCount));
    syncRepeatableFieldState(formEl, container, fieldConfig, fieldName);
    return true;
  }

  function handleRepeatableFieldRemove(formEl, event) {
    const removeButton = event.target.closest("[data-repeatable-field-remove]");
    if (!removeButton) {
      return false;
    }

    const fieldName = removeButton.dataset.repeatableFieldRemove;
    const container = formEl.querySelector(`[data-repeatable-field="${cssEscape(fieldName)}"]`);
    const minItems = Number(container.dataset.repeatableMin || 1);
    if (container.querySelectorAll(".stack-item").length <= minItems) {
      return true;
    }

    removeButton.closest(".stack-item").remove();
    syncRepeatableFieldState(formEl, container, findFieldConfigByName(getCurrentFormConfig(), fieldName), fieldName);
    return true;
  }

  function handleFormSubmit(formEl, event) {
    event.preventDefault();
    syncConditionalState(formEl);

    const preview = document.getElementById("preview-output");
    if (!formEl.reportValidity()) {
      preview.textContent = "Form validation failed. Check highlighted required fields and visible conditional fields.";
      return;
    }

    preview.textContent = JSON.stringify(collectFormData(formEl), null, 2);
  }

  function initializeRepeatableSections(formEl) {
    formEl.querySelectorAll("[data-repeatable-list]").forEach((list) => {
      updateRepeatableHeadings(list, list.dataset.repeatableList);
    });
  }

  function initializeRepeatableFields(formEl) {
    formEl.querySelectorAll("[data-repeatable-field]").forEach((container) => {
      const fieldName = container.dataset.repeatableField;
      syncRepeatableFieldState(formEl, container, findFieldConfigByName(getCurrentFormConfig(), fieldName), fieldName);
    });
  }

  function resetRepeatableStructures(formEl) {
    const formConfig = getCurrentFormConfig();

    formEl.querySelectorAll("[data-repeatable-list]").forEach((list) => {
      const repeatableKey = list.dataset.repeatableList;
      const section = formConfig.sections.find((item) => item.repeatable && item.repeatable.key === repeatableKey);
      list.innerHTML = renderRepeatableCard(section.repeatable, 0);
      updateRepeatableHeadings(list, repeatableKey);
    });

    formEl.querySelectorAll("[data-repeatable-field]").forEach((container) => {
      const fieldName = container.dataset.repeatableField;
      const fieldConfig = findFieldConfigByName(formConfig, fieldName);
      const minItems = Number(container.dataset.repeatableMin || 1);

      container.innerHTML = "";
      for (let index = 0; index < minItems; index += 1) {
        container.insertAdjacentHTML("beforeend", renderRepeatableFieldItem(fieldConfig, fieldName, index));
      }

      syncRepeatableFieldState(formEl, container, fieldConfig, fieldName);
    });
  }

  function syncRepeatableFieldState(formEl, container, field, fieldName) {
    const minItems = Number(container.dataset.repeatableMin || 1);
    const maxItems = Number(container.dataset.repeatableMax || 1);
    const items = Array.from(container.querySelectorAll(".stack-item"));

    items.forEach((item, index) => {
      const input = item.querySelector("input");
      const itemName = `${fieldName}[${index}]`;
      input.id = inputId(itemName);
      input.name = itemName;
      input.required = field.required === "Y" && index < minItems;

      const removeButton = item.querySelector("[data-repeatable-field-remove]");
      const shouldShowRemove = field.repeatable.max > field.repeatable.min && index >= minItems;
      if (shouldShowRemove && !removeButton) {
        item.insertAdjacentHTML("beforeend", renderRepeatableFieldRemoveButton(fieldName, field.repeatable.itemLabel));
      }
      if (!shouldShowRemove && removeButton) {
        removeButton.remove();
      }
    });

    const addButton = formEl.querySelector(`[data-repeatable-field-add="${cssEscape(fieldName)}"]`);
    if (addButton) {
      addButton.hidden = items.length >= maxItems;
    }
  }

  function updateRepeatableHeadings(list, repeatableKey) {
    list.querySelectorAll(`[data-repeatable-item="${repeatableKey}"]`).forEach((item, index) => {
      const heading = item.querySelector("h3");
      if (heading) {
        heading.textContent = `${list.dataset.itemLabel} ${index + 1}`;
      }
    });
  }

  function syncConditionalState(formEl) {
    formEl.querySelectorAll("[data-depends-on]").forEach((node) => {
      const isVisible = evaluateDependency(formEl, node.dataset.dependsOn, node.dataset.dependsMode, node.dataset.dependsValue);
      node.hidden = !isVisible;

      node.querySelectorAll("input, select, textarea").forEach((input) => {
        if (isVisible) {
          if (input.dataset.wasDisabled === "true") {
            input.disabled = false;
            delete input.dataset.wasDisabled;
          }
          return;
        }

        if (input.disabled) {
          return;
        }

        input.disabled = true;
        input.dataset.wasDisabled = "true";
        if (input.type === "checkbox" || input.type === "radio") {
          input.checked = false;
        } else {
          input.value = "";
        }
      });
    });

    formEl.querySelectorAll("[data-detail-list]").forEach((container) => {
      renderDetailInputs(formEl, container);
    });
  }

  function renderDetailInputs(formEl, container) {
    const sourceFieldName = container.dataset.detailList;
    const detailFieldName = container.dataset.detailName;
    const detailType = container.dataset.detailType;
    const selectedOptions = getFieldValue(formEl, sourceFieldName);

    if (!Array.isArray(selectedOptions) || selectedOptions.length === 0) {
      container.innerHTML = '<p class="detail-placeholder">Select one or more values above to reveal details.</p>';
      return;
    }

    const options = findFieldConfigByName(getCurrentFormConfig(), detailFieldName).options || [];
    container.innerHTML = selectedOptions
      .map((option, index) => renderDetailItem(detailType, detailFieldName, option, index, options))
      .join("");
  }

  function renderDetailItem(detailType, detailFieldName, option, index, options) {
    if (detailType === "details-number") {
      return `
        <div class="detail-item">
          <label for="${escapeAttr(inputId(`${detailFieldName}[${index}]`))}">${escapeHtml(option)} amount</label>
          <input
            id="${escapeAttr(inputId(`${detailFieldName}[${index}]`))}"
            name="${escapeAttr(`${detailFieldName}.${slugify(option)}`)}"
            type="number"
            min="0"
            step="1"
          >
        </div>
      `;
    }

    return `
      <div class="detail-item">
        <label for="${escapeAttr(inputId(`${detailFieldName}[${index}]`))}">${escapeHtml(option)} condition</label>
        <select id="${escapeAttr(inputId(`${detailFieldName}[${index}]`))}" name="${escapeAttr(`${detailFieldName}.${slugify(option)}`)}">
          <option value="">Select...</option>
          ${options.map((item) => `<option value="${escapeAttr(item)}">${escapeHtml(item)}</option>`).join("")}
        </select>
      </div>
    `;
  }

  function evaluateDependency(formEl, fieldName, mode, expectedValue) {
    const currentValue = getFieldValue(formEl, fieldName);
    if (mode === "equals") {
      return String(currentValue) === expectedValue;
    }
    if (mode === "includes") {
      return Array.isArray(currentValue) ? currentValue.includes(expectedValue) : String(currentValue) === expectedValue;
    }
    if (mode === "hasAny") {
      return Array.isArray(currentValue) ? currentValue.length > 0 : Boolean(currentValue);
    }
    return true;
  }

  function getFieldValue(formEl, fieldName) {
    const exactName = cssEscape(fieldName);
    const nodes = Array.from(formEl.querySelectorAll(`[name="${exactName}"]`)).filter((node) => !node.disabled);
    if (nodes.length === 0) {
      const childNodes = Array.from(formEl.querySelectorAll(`[name^="${exactName}."]`)).filter((node) => !node.disabled);
      return childNodes.length ? childNodes.map((node) => node.value).filter(Boolean) : "";
    }

    const firstNode = nodes[0];
    if (firstNode.type === "checkbox") {
      return nodes.length === 1 ? firstNode.checked : nodes.filter((node) => node.checked).map((node) => node.value);
    }
    if (firstNode.type === "radio") {
      const checkedNode = nodes.find((node) => node.checked);
      return checkedNode ? checkedNode.value : "";
    }
    return firstNode.value;
  }

  function collectFormData(formEl) {
    const output = {};
    const inputs = Array.from(formEl.querySelectorAll("input, select, textarea")).filter((node) => node.name && !node.disabled);
    inputs.forEach((node) => {
      assignValue(output, node.name, readInputValue(node));
    });
    return output;
  }

  function readInputValue(node) {
    if (node.type === "checkbox") {
      return node.name.includes(".") ? (node.checked ? node.value : undefined) : node.checked;
    }
    if (node.type === "radio") {
      return node.checked ? node.value : undefined;
    }
    return node.value;
  }

  function assignValue(target, path, value) {
    if (value === undefined || value === "") {
      return;
    }

    const parts = path.split(".");
    let cursor = target;

    parts.forEach((part, index) => {
      const isLastPart = index === parts.length - 1;
      const arrayMatch = part.match(/^([^\[]+)\[(\d+)\]$/);

      if (arrayMatch) {
        const [, key, rawIndex] = arrayMatch;
        const arrayIndex = Number(rawIndex);
        cursor[key] = cursor[key] || [];
        cursor[key][arrayIndex] = cursor[key][arrayIndex] || {};
        if (isLastPart) {
          cursor[key][arrayIndex] = value;
        } else {
          cursor = cursor[key][arrayIndex];
        }
        return;
      }

      if (isLastPart) {
        if (cursor[part] === undefined) {
          cursor[part] = value;
        } else if (Array.isArray(cursor[part])) {
          cursor[part].push(value);
        } else {
          cursor[part] = [cursor[part], value];
        }
        return;
      }

      cursor[part] = cursor[part] || {};
      cursor = cursor[part];
    });
  }

  function findFieldConfigByName(formConfig, fieldName) {
    for (const section of formConfig.sections) {
      if (section.fields) {
        const directField = section.fields.find(
          (field) => field.key === fieldName || fieldName.endsWith(`.${field.key}`)
        );
        if (directField) {
          return directField;
        }
      }

      if (section.repeatable) {
        const repeatableField = section.repeatable.fields.find((field) => fieldName.endsWith(`.${field.key}`));
        if (repeatableField) {
          return repeatableField;
        }
      }
    }
    return {};
  }

  function isDetailField(field) {
    return field.type === "details-select" || field.type === "details-number";
  }

  function isWideField(field) {
    return field.type === "textarea" || field.type === "gps" || field.type === "checkbox-group";
  }

  function getCurrentFormConfig() {
    return formsById[document.body.dataset.formId];
  }

  function dependencyAttributes(dependsOn) {
    if (!dependsOn) {
      return "";
    }
    if (dependsOn.equals !== undefined) {
      return `data-depends-on="${escapeAttr(dependsOn.field)}" data-depends-mode="equals" data-depends-value="${escapeAttr(String(dependsOn.equals))}" hidden`;
    }
    if (dependsOn.includes !== undefined) {
      return `data-depends-on="${escapeAttr(dependsOn.field)}" data-depends-mode="includes" data-depends-value="${escapeAttr(String(dependsOn.includes))}" hidden`;
    }
    if (dependsOn.hasAny) {
      return `data-depends-on="${escapeAttr(dependsOn.field)}" data-depends-mode="hasAny" data-depends-value="true" hidden`;
    }
    return "";
  }

  function requiredAttribute(required) {
    return required === "Y" ? "required" : "";
  }

  function placeholderAttribute(field) {
    const supportsPlaceholder = field.type === "text" || field.type === "number" || field.type === "textarea";
    if (!supportsPlaceholder) {
      return "";
    }

    const bits = [];
    if (field.placeholder) {
      bits.push(field.placeholder);
    } else if (field.required === "Y") {
      bits.push("Required");
    }
    if (field.unit) {
      bits.push(`(${field.unit})`);
    }

    return bits.length ? `placeholder="${escapeAttr(bits.join(" "))}"` : "";
  }

  function inputId(name) {
    return `field-${slugify(name)}`;
  }

  function inputNameForCompositeField(fieldName, targetKey) {
    const lastDot = fieldName.lastIndexOf(".");
    return lastDot === -1 ? targetKey : `${fieldName.slice(0, lastDot + 1)}${targetKey}`;
  }

  function renderRepeatableFieldRemoveButton(fieldName, itemLabel) {
    return `<button type="button" class="button-link inline-symbol-button remove-inline" data-repeatable-field-remove="${fieldName}" aria-label="Remove ${escapeAttr(itemLabel)}">-</button>`;
  }

  function joinAttributes(attributes) {
    return attributes.filter(Boolean).join(" ");
  }

  function slugify(value) {
    return String(value)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function cssEscape(value) {
    return String(value).replace(/"/g, '\\"');
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function escapeAttr(value) {
    return escapeHtml(value);
  }
})();
