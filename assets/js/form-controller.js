import { renderDetailItem, renderRepeatableCard, renderRepeatableFieldItem, renderRepeatableFieldRemoveButton } from "./rendering.js";
import { cssEscape, escapeAttr, escapeHtml, inputId, slugify } from "./utils.js";

/* Form controller wires repeatables, conditional fields, layout sync, and preview output. */

export function createFormController(getCurrentFormConfig) {
  return {
    initializeForm
  };

  function initializeForm(formEl) {
    initializeRepeatableSections(formEl);
    initializeRepeatableFields(formEl);
    syncConditionalState(formEl);
    syncSectionLabelWidths(formEl);
    bindFormEvents(formEl);
    bindResizeSync(formEl);
  }

  /* DOM event binding keeps click, keyboard, reset, and submit logic centralized. */

  function bindFormEvents(formEl) {
    formEl.addEventListener("click", (event) => handleFormClick(formEl, event));
    formEl.addEventListener("keydown", (event) => handleFormKeydown(formEl, event));
    formEl.addEventListener("change", () => {
      syncConditionalState(formEl);
      syncSectionLabelWidths(formEl);
    });
    formEl.addEventListener("submit", (event) => handleFormSubmit(formEl, event));
    formEl.addEventListener("reset", () => {
      window.setTimeout(() => {
        resetRepeatableStructures(formEl);
        syncConditionalState(formEl);
        syncSectionLabelWidths(formEl);
        document.getElementById("preview-output").textContent = "Submit the form to preview the structured payload.";
      }, 0);
    });
  }

  function bindResizeSync(formEl) {
    let frameId = 0;

    window.addEventListener("resize", () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }

      frameId = window.requestAnimationFrame(() => {
        syncSectionLabelWidths(formEl);
        frameId = 0;
      });
    });
  }

  /* Click and keyboard handlers manage repeatable cards and chip-style fields. */

  function handleFormClick(formEl, event) {
    if (handleRepeatableTokenRemove(formEl, event)) {
      return;
    }
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

  function handleFormKeydown(formEl, event) {
    handleRepeatableTokenInput(formEl, event);
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
    syncSectionLabelWidths(formEl);
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
      syncSectionLabelWidths(formEl);
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
    syncSectionLabelWidths(formEl);
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
    syncSectionLabelWidths(formEl);
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

  /* Repeatable field setup handles both stacked inputs and chip-input variants. */

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
      if (container.dataset.repeatableMode === "chips") {
        container.innerHTML = "";
        syncRepeatableFieldState(formEl, container, fieldConfig, fieldName);
        return;
      }

      const minItems = Number(container.dataset.repeatableMin || 1);
      container.innerHTML = "";
      for (let index = 0; index < minItems; index += 1) {
        container.insertAdjacentHTML("beforeend", renderRepeatableFieldItem(fieldConfig, fieldName, index));
      }

      syncRepeatableFieldState(formEl, container, fieldConfig, fieldName);
    });
  }

  function syncRepeatableFieldState(formEl, container, field, fieldName) {
    if (container.dataset.repeatableMode === "chips") {
      syncRepeatableTokenFieldState(container, field, fieldName);
      return;
    }

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

  function syncRepeatableTokenFieldState(container, field, fieldName) {
    const wrapper = container.closest(".repeatable-token-field");
    const chipList = wrapper.querySelector(`[data-repeatable-chip-list="${cssEscape(fieldName)}"]`);
    const input = wrapper.querySelector(`[data-repeatable-field-input="${cssEscape(fieldName)}"]`);
    const values = Array.from(container.querySelectorAll('input[type="hidden"]')).map((node) => node.value).filter(Boolean);
    const minItems = Number(container.dataset.repeatableMin || 1);
    const maxItems = Number(container.dataset.repeatableMax || 1);

    container.innerHTML = values
      .map(
        (value, index) => `
          <input type="hidden" name="${escapeAttr(`${fieldName}[${index}]`)}" value="${escapeAttr(value)}">
        `
      )
      .join("");

    chipList.innerHTML = values
      .map(
        (value, index) => `
          <span class="repeatable-token-chip">
            <span>${escapeHtml(value)}</span>
            <button
              type="button"
              class="repeatable-token-remove"
              data-repeatable-chip-remove="${escapeAttr(fieldName)}"
              data-repeatable-chip-index="${index}"
              aria-label="Remove ${escapeAttr(value)}"
            >x</button>
          </span>
        `
      )
      .join("");

    input.required = field.required === "Y" && values.length < minItems;
    input.disabled = values.length >= maxItems;
    input.value = "";
    input.placeholder =
      values.length >= maxItems
        ? `${field.repeatable.itemLabel} limit reached`
        : field.repeatable.max > 1
          ? `Type ${field.repeatable.itemLabel} and press Enter`
          : `Type ${field.repeatable.itemLabel}`;

    if (field.required === "Y" && values.length < minItems) {
      input.setCustomValidity(`Add at least ${minItems} ${field.repeatable.itemLabel}${minItems > 1 ? "s" : ""}.`);
    } else {
      input.setCustomValidity("");
    }
  }

  function handleRepeatableTokenInput(formEl, event) {
    const input = event.target.closest("[data-repeatable-field-input]");
    if (!input || event.key !== "Enter") {
      return false;
    }

    event.preventDefault();
    const fieldName = input.dataset.repeatableFieldInput;
    const container = formEl.querySelector(`[data-repeatable-field="${cssEscape(fieldName)}"]`);
    const fieldConfig = findFieldConfigByName(getCurrentFormConfig(), fieldName);
    const value = input.value.trim();
    const values = Array.from(container.querySelectorAll('input[type="hidden"]')).map((node) => node.value);
    const maxItems = Number(container.dataset.repeatableMax || 1);

    if (!value || values.length >= maxItems || values.includes(value)) {
      input.value = "";
      return true;
    }

    values.push(value);
    container.innerHTML = values
      .map(
        (item, index) =>
          `<input type="hidden" name="${escapeAttr(`${fieldName}[${index}]`)}" value="${escapeAttr(item)}">`
      )
      .join("");
    syncRepeatableFieldState(formEl, container, fieldConfig, fieldName);
    syncSectionLabelWidths(formEl);
    return true;
  }

  function handleRepeatableTokenRemove(formEl, event) {
    const removeButton = event.target.closest("[data-repeatable-chip-remove]");
    if (!removeButton) {
      return false;
    }

    const fieldName = removeButton.dataset.repeatableChipRemove;
    const removeIndex = Number(removeButton.dataset.repeatableChipIndex);
    const container = formEl.querySelector(`[data-repeatable-field="${cssEscape(fieldName)}"]`);
    const fieldConfig = findFieldConfigByName(getCurrentFormConfig(), fieldName);
    const values = Array.from(container.querySelectorAll('input[type="hidden"]'))
      .map((node) => node.value)
      .filter((_, index) => index !== removeIndex);

    container.innerHTML = values
      .map(
        (item, index) =>
          `<input type="hidden" name="${escapeAttr(`${fieldName}[${index}]`)}" value="${escapeAttr(item)}">`
      )
      .join("");
    syncRepeatableFieldState(formEl, container, fieldConfig, fieldName);
    syncSectionLabelWidths(formEl);
    return true;
  }

  /* Layout syncing keeps labels aligned until a field needs to stack. */

  function syncSectionLabelWidths(formEl) {
    const inlineGap = 14;
    const maxInlineLabelWidth = 260;

    formEl.querySelectorAll(".form-section").forEach((section) => {
      const fields = Array.from(section.querySelectorAll('.field--inline:not([hidden])'));
      if (fields.length === 0) {
        section.style.removeProperty("--inline-label-column");
        return;
      }

      const inlineFieldsByColumn = new Map();

      fields.forEach((field) => {
        const label = field.querySelector(":scope > label");
        if (!label) {
          return;
        }

        const labelWidth = measureNaturalLabelWidth(label);
        const preferredInlineLabelWidth = Math.min(maxInlineLabelWidth, Math.max(88, Math.ceil(labelWidth)));
        const fieldWidth = field.getBoundingClientRect().width;
        const shouldStack = preferredInlineLabelWidth + inlineGap + getMinimumControlWidth(field) > fieldWidth;

        field.classList.toggle("field--stacked-inline", shouldStack);
        if (!shouldStack) {
          const columnKey = Math.round(field.getBoundingClientRect().left);
          const group = inlineFieldsByColumn.get(columnKey) || [];
          group.push({ field, preferredInlineLabelWidth });
          inlineFieldsByColumn.set(columnKey, group);
        } else {
          field.style.removeProperty("--field-inline-label-column");
        }
      });

      if (inlineFieldsByColumn.size === 0) {
        section.style.removeProperty("--inline-label-column");
        return;
      }

      const inlineLabelWidths = [];
      inlineFieldsByColumn.forEach((group) => {
        const columnWidth = Math.max(...group.map((item) => item.preferredInlineLabelWidth));
        inlineLabelWidths.push(columnWidth);
        group.forEach(({ field }) => {
          field.style.setProperty("--field-inline-label-column", `${columnWidth}px`);
        });
      });

      const widestLabel = Math.max(...inlineLabelWidths);
      const clampedWidth = Math.min(maxInlineLabelWidth, Math.max(88, Math.ceil(widestLabel)));
      section.style.setProperty("--inline-label-column", `${clampedWidth}px`);
    });
  }

  function measureNaturalLabelWidth(label) {
    const clone = label.cloneNode(true);
    clone.style.position = "absolute";
    clone.style.visibility = "hidden";
    clone.style.width = "max-content";
    clone.style.maxWidth = "none";
    clone.style.whiteSpace = "nowrap";
    clone.style.pointerEvents = "none";

    document.body.appendChild(clone);
    const width = clone.getBoundingClientRect().width;
    clone.remove();

    return width;
  }

  function getMinimumControlWidth(field) {
    if (field.querySelector(".option-list")) {
      return 200;
    }

    return 220;
  }

  /* Conditional fields and detail controls rerender based on visible state. */

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
    const existingValues = collectDetailValues(container);

    if (!Array.isArray(selectedOptions) || selectedOptions.length === 0) {
      container.innerHTML = '<p class="detail-placeholder">Select one or more values above to reveal details.</p>';
      return;
    }

    const options = findFieldConfigByName(getCurrentFormConfig(), detailFieldName).options || [];
    container.innerHTML = selectedOptions
      .map((option, index) => renderDetailItem(detailType, detailFieldName, option, index, options, existingValues[slugify(option)]))
      .join("");
  }

  function collectDetailValues(container) {
    return Array.from(container.querySelectorAll("input, select")).reduce((values, field) => {
      const name = field.name || "";
      const key = name.split(".").pop();
      if (key && field.value) {
        values[key] = field.value;
      }
      return values;
    }, {});
  }

  /* Data helpers drive dependencies and preview JSON output. */

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
        const directField = section.fields.find((field) => field.key === fieldName || fieldName.endsWith(`.${field.key}`));
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
}
