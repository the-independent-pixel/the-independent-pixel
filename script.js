(() => {
  "use strict";

  const form = document.querySelector("[data-contact-form]");
  const yearElement = document.querySelector("[data-current-year]");

  if (yearElement) {
    yearElement.textContent = String(new Date().getFullYear());
  }

  if (!form) {
    return;
  }

  const fields = Array.from(form.querySelectorAll("[data-validate]"));
  const statusElement = form.querySelector("[data-form-status]");
  const submitButton = form.querySelector('button[type="submit"]');
  const submitLabel = form.querySelector("[data-submit-label]");

  const defaultSubmitLabel = submitLabel
    ? submitLabel.textContent
    : "Invia la richiesta";

  /*
   * Native validation remains available when JavaScript is disabled.
   * When JavaScript is active, custom accessible messages are used.
   */
  form.noValidate = true;

  const getValidationMessage = (field) => {
    const label = form.querySelector(`label[for="${field.id}"]`);
    const fieldName = label
      ? label.textContent.trim()
      : "Questo campo";

    if (field.validity.valueMissing) {
      if (field.type === "checkbox") {
        return "Conferma questa voce prima di proseguire.";
      }

      return `${fieldName}: completa questo campo.`;
    }

    if (field.validity.typeMismatch && field.type === "email") {
      return "Inserisci un indirizzo email valido, ad esempio nome@dominio.it.";
    }

    if (field.validity.tooShort) {
      if (field.tagName === "TEXTAREA") {
        return "Aggiungi qualche dettaglio in più per aiutarmi a capire il progetto.";
      }

      return "Inserisci almeno due caratteri.";
    }

    if (field.validity.patternMismatch) {
      return "Controlla il formato di questo campo.";
    }

    return "Controlla questo campo prima di proseguire.";
  };

  const getFieldWrapper = (field) => {
    return field.closest("[data-field]");
  };

  const clearFieldError = (field) => {
    const wrapper = getFieldWrapper(field);

    if (!wrapper) {
      return;
    }

    const errorElement = wrapper.querySelector("[data-field-error]");

    wrapper.removeAttribute("data-invalid");
    field.removeAttribute("aria-invalid");

    if (errorElement) {
      errorElement.textContent = "";
    }
  };

  const showFieldError = (field) => {
    const wrapper = getFieldWrapper(field);

    if (!wrapper) {
      return;
    }

    const errorElement = wrapper.querySelector("[data-field-error]");

    wrapper.setAttribute("data-invalid", "true");
    field.setAttribute("aria-invalid", "true");

    if (errorElement) {
      errorElement.textContent = getValidationMessage(field);
    }
  };

  const validateField = (field) => {
    if (field.checkValidity()) {
      clearFieldError(field);
      return true;
    }

    showFieldError(field);
    return false;
  };

  const setFormStatus = (state, message) => {
    if (!statusElement) {
      return;
    }

    if (!state) {
      statusElement.removeAttribute("data-state");
      statusElement.textContent = "";
      return;
    }

    statusElement.dataset.state = state;
    statusElement.textContent = message;
  };

  const setLoadingState = (isLoading) => {
    if (submitButton) {
      submitButton.disabled = isLoading;
    }

    form.setAttribute("aria-busy", String(isLoading));

    if (submitLabel) {
      submitLabel.textContent = isLoading
        ? "Invio in corso…"
        : defaultSubmitLabel;
    }
  };

  const resetValidation = () => {
    fields.forEach((field) => {
      clearFieldError(field);
    });
  };

  fields.forEach((field) => {
    field.addEventListener("blur", () => {
      validateField(field);
    });

    field.addEventListener("input", () => {
      if (field.getAttribute("aria-invalid") === "true") {
        validateField(field);
      }
    });

    field.addEventListener("change", () => {
      if (field.getAttribute("aria-invalid") === "true") {
        validateField(field);
      }
    });
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    setFormStatus("", "");

    let firstInvalidField = null;

    fields.forEach((field) => {
      const isValid = validateField(field);

      if (!isValid && !firstInvalidField) {
        firstInvalidField = field;
      }
    });

    if (firstInvalidField) {
      setFormStatus(
        "error",
        "Ci sono alcuni campi da controllare. Ho indicato cosa manca direttamente nel modulo."
      );

      firstInvalidField.focus();
      return;
    }

    const action = "https://my-lead.inpixel-studio.workers.dev/api/hello";
    const method = (form.getAttribute("method") || "post").toUpperCase();

    /*
     * Replace [endpoint-form] with the real server endpoint before launch.
     * Server-side validation remains mandatory.
     */
    if (!action || action.includes("[endpoint-form]")) {
      setFormStatus(
        "error",
        "Il modulo è pronto, ma l'invio non è ancora collegato. Configura l'endpoint del form prima della pubblicazione."
      );
      return;
    }

    setLoadingState(true);
    setFormStatus(
      "loading",
      "Sto inviando la richiesta. Un momento…"
    );

    try {
      const response = await fetch(action, {
        method,
        body: new FormData(form),
        headers: {
          Accept: "application/json"
        }
      });

      console.log(response);

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      form.reset();
      resetValidation();

      setFormStatus(
        "success",
        "Richiesta inviata. Grazie: ora il progetto non è più soltanto nella tua testa."
      );
    } catch (error) {
      console.error("Contact form submission failed:", error);

      setFormStatus(
        "error",
        "Non sono riuscito a inviare la richiesta. Riprova tra poco oppure usa il contatto email indicato nella pagina."
      );
    } finally {
      setLoadingState(false);
    }
  });
})();
