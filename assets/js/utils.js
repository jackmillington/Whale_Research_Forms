/* Shared string, attribute, and field helper utilities. */

export function isDetailField(field) {
  return field.type === "details-select" || field.type === "details-number";
}

export function isWideField(field) {
  return field.type === "textarea" || field.type === "gps" || field.type === "checkbox-group";
}

/* Dependency and placeholder helpers keep markup generation consistent. */

export function dependencyAttributes(dependsOn) {
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

export function requiredAttribute(required) {
  return required === "Y" ? "required" : "";
}

export function placeholderAttribute(field) {
  const supportsPlaceholder = field.type === "text" || field.type === "number" || field.type === "textarea";
  if (!supportsPlaceholder) {
    return "";
  }

  if (field.placeholder) {
    return `placeholder="${escapeAttr(field.placeholder)}"`;
  }

  return field.required === "Y" ? 'placeholder="Required"' : "";
}

/* Name and id helpers keep generated inputs stable across rerenders. */

export function inputId(name) {
  return `field-${slugify(name)}`;
}

export function inputNameForCompositeField(fieldName, targetKey) {
  const lastDot = fieldName.lastIndexOf(".");
  return lastDot === -1 ? targetKey : `${fieldName.slice(0, lastDot + 1)}${targetKey}`;
}

export function joinAttributes(attributes) {
  return attributes.filter(Boolean).join(" ");
}

/* Escaping helpers prevent generated markup from breaking. */

export function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function cssEscape(value) {
  return String(value).replace(/"/g, '\\"');
}

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function escapeAttr(value) {
  return escapeHtml(value);
}
