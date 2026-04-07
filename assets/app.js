import { createFormController } from "./js/form-controller.js";
import { buildFormPageMarkup, buildLandingCards } from "./js/rendering.js";
import { createThemeController } from "./js/theme.js";

/* App bootstrap coordinates page mode, ordering, rendering, and theme setup. */

const forms = window.WHALE_FORMS || [];
const preferredFormOrder = [
  "research-logbook",
  "newborn",
  "cos-study",
  "dolphing-sightings-w-whales"
];
const orderedForms = getOrderedForms(forms, preferredFormOrder);
const formsById = Object.fromEntries(forms.map((form) => [form.id, form]));

const theme = createThemeController();
const formController = createFormController(() => formsById[document.body.dataset.formId]);

document.addEventListener("DOMContentLoaded", initApp);

function initApp() {
  theme.applyTheme(theme.readThemePreference());
  theme.bindThemeControls();

  const mode = document.body.dataset.app;
  if (mode === "landing") {
    renderLandingPage();
  } else if (mode === "form") {
    renderFormPage(document.body.dataset.formId);
  }

  theme.syncThemeControls();
}

/* Landing and form-page rendering are intentionally thin wrappers. */

function renderLandingPage() {
  const grid = document.getElementById("forms-grid");
  if (!grid) {
    return;
  }

  grid.innerHTML = buildLandingCards(orderedForms);
}

function renderFormPage(formId) {
  const formConfig = formsById[formId];
  const root = document.getElementById("form-page-root");
  if (!formConfig || !root) {
    return;
  }

  root.innerHTML = buildFormPageMarkup(formConfig, orderedForms);

  const formEl = document.getElementById("workbook-form");
  formController.initializeForm(formEl);
}

/* Preferred ordering applies to both the landing page and sidebar links. */

function getOrderedForms(sourceForms, preferredOrder) {
  const rankById = new Map(preferredOrder.map((id, index) => [id, index]));

  return sourceForms
    .map((form, index) => ({ form, index }))
    .sort((left, right) => {
      const leftRank = rankById.has(left.form.id) ? rankById.get(left.form.id) : Number.MAX_SAFE_INTEGER;
      const rightRank = rankById.has(right.form.id) ? rankById.get(right.form.id) : Number.MAX_SAFE_INTEGER;

      if (leftRank !== rightRank) {
        return leftRank - rightRank;
      }

      return left.index - right.index;
    })
    .map(({ form }) => form);
}
