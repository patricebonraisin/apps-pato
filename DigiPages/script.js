const homeScreen = document.querySelector('[data-screen="home"]');
const modelsScreen = document.querySelector('[data-screen="models"]');
const businessCardScreen = document.querySelector('[data-screen="business-card"]');
const previewScreen = document.querySelector('[data-screen="preview"]');
const animalScreen = document.querySelector('[data-screen="animal"]');
const animalPreviewScreen = document.querySelector('[data-screen="animal-preview"]');
const openModelsButton = document.querySelector('[data-action="open-models"]');
const openBusinessCardButton = document.querySelector('[data-action="open-business-card"]');
const openAnimalButton = document.querySelector('[data-action="open-animal"]');
const openPreviewButton = document.querySelector('[data-action="open-preview"]');
const openAnimalPreviewButton = document.querySelector('[data-action="open-animal-preview"]');
const goHomeButton = document.querySelector('[data-action="go-home"]');
const goModelsButton = document.querySelector('[data-action="go-models"]');
const goModelsFromAnimalButton = document.querySelector('[data-action="go-models-from-animal"]');
const editBusinessCardButton = document.querySelector('[data-action="edit-business-card"]');
const editAnimalButton = document.querySelector('[data-action="edit-animal"]');
const clearBusinessCardDraftButton = document.querySelector('[data-action="clear-business-card-draft"]');
const clearAnimalDraftButton = document.querySelector('[data-action="clear-animal-draft"]');
const businessCardForm = document.querySelector(".business-card-form");
const animalForm = document.querySelector(".animal-form");
const photoInput = document.querySelector("#photo");
const animalPhotoInput = document.querySelector("#animal-photo");
const previewPhoto = document.querySelector('[data-preview="photo"]');
const previewName = document.querySelector('[data-preview="name"]');
const previewCompany = document.querySelector('[data-preview="company"]');
const previewPosition = document.querySelector('[data-preview="position"]');
const previewDescription = document.querySelector('[data-preview="description"]');
const previewDetails = document.querySelector('[data-preview="details"]');
const previewActions = document.querySelector('[data-preview="actions"]');
const animalPreviewPhoto = document.querySelector('[data-animal-preview="photo"]');
const animalPreviewName = document.querySelector('[data-animal-preview="name"]');
const animalPreviewMeta = document.querySelector('[data-animal-preview="meta"]');
const animalPreviewDetails = document.querySelector('[data-animal-preview="details"]');
const animalPreviewActions = document.querySelector('[data-animal-preview="actions"]');
const textEncoder = new TextEncoder();
const businessCardDraftKey = "digipages.business-card-draft";
const animalDraftKey = "digipages.animal-draft";

let photoURL;
let animalPhotoURL;
let contactURL;

function draftFields(form) {
    return form.querySelectorAll('input:not([type="file"]), textarea, select');
}

function saveDraft(form, key) {
    const draft = {};

    draftFields(form).forEach((field) => {
        draft[field.name] = field.value;
    });

    try {
        localStorage.setItem(key, JSON.stringify(draft));
    } catch {
        // La page reste utilisable si le stockage local n'est pas disponible.
    }
}

function restoreDraft(form, key) {
    let savedDraft;

    try {
        savedDraft = localStorage.getItem(key);
    } catch {
        return;
    }

    if (!savedDraft) {
        return;
    }

    try {
        const draft = JSON.parse(savedDraft);

        if (!draft || typeof draft !== "object") {
            return;
        }

        draftFields(form).forEach((field) => {
            if (typeof draft[field.name] === "string") {
                field.value = draft[field.name];
            }
        });
    } catch {
        // Un brouillon invalide est ignoré sans interrompre la page.
    }
}

function configureDraft(form, key) {
    restoreDraft(form, key);

    draftFields(form).forEach((field) => {
        field.addEventListener("input", () => saveDraft(form, key));
        field.addEventListener("change", () => saveDraft(form, key));
    });
}

function clearDraft(form, key, message) {
    if (!window.confirm(message)) {
        return;
    }

    try {
        localStorage.removeItem(key);
    } catch {
        // Le formulaire est tout de même vidé après confirmation.
    }

    form.reset();
}

function showScreen(screen) {
    const screens = {
        home: homeScreen,
        models: modelsScreen,
        "business-card": businessCardScreen,
        preview: previewScreen,
        animal: animalScreen,
        "animal-preview": animalPreviewScreen
    };
    const nextScreen = screens[screen];

    Object.values(screens).forEach((element) => {
        element.hidden = element !== nextScreen;
    });

    window.scrollTo(0, 0);

    // Le titre annonce le nouvel écran aux lecteurs d’écran sans attirer le regard
    // vers le bouton Retour ou modifier l’ordre naturel de navigation au clavier.
    const heading = nextScreen.querySelector("h1");

    if (heading) {
        heading.focus({ preventScroll: true });
    }
}

function valueFor(id) {
    return document.querySelector(`#${id}`).value.trim();
}

function setPreviewText(element, value) {
    element.textContent = value;
    element.hidden = !value;
}

function externalURL(value) {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
        return "";
    }

    const candidateURL = /^https?:\/\//i.test(trimmedValue)
        ? trimmedValue
        : `https://${trimmedValue}`;

    try {
        const url = new URL(candidateURL);

        return url.protocol === "http:" || url.protocol === "https:" ? url.href : "";
    } catch {
        return "";
    }
}

function addDetail(label, value) {
    if (!value) {
        return;
    }

    const item = document.createElement("div");
    const itemLabel = document.createElement("span");
    const itemValue = document.createElement("span");

    item.className = "preview-detail";
    itemLabel.className = "preview-detail-label";
    itemLabel.textContent = label;
    itemValue.className = "preview-detail-value";
    itemValue.textContent = value;
    item.append(itemLabel, itemValue);
    previewDetails.append(item);
}

function addAction(label, href, external = false, filename = "") {
    if (!href) {
        return;
    }

    const action = document.createElement("a");

    action.className = "preview-action";
    action.href = href;
    action.textContent = label;

    if (external) {
        action.target = "_blank";
        action.rel = "noopener noreferrer";
    }

    if (filename) {
        action.download = filename;
    }

    previewActions.append(action);
}

function escapeVCardValue(value) {
    return value
        .replace(/\\/g, "\\\\")
        .replace(/\r?\n/g, "\\n")
        .replace(/;/g, "\\;")
        .replace(/,/g, "\\,");
}

function foldVCardLine(line) {
    let foldedLine = "";
    let currentLine = "";

    for (const character of line) {
        if (textEncoder.encode(currentLine + character).length > 75) {
            foldedLine += `${currentLine}\r\n `;
            currentLine = character;
        } else {
            currentLine += character;
        }
    }

    return foldedLine + currentLine;
}

function createVCard(data) {
    const name = [data.firstName, data.lastName].filter(Boolean).join(" ");
    const formattedName = name || data.company;
    const lines = ["BEGIN:VCARD", "VERSION:3.0"];

    if (data.firstName || data.lastName) {
        lines.push(`N;CHARSET=UTF-8:${escapeVCardValue(data.lastName)};${escapeVCardValue(data.firstName)};;;`);
    }

    if (formattedName) {
        lines.push(`FN;CHARSET=UTF-8:${escapeVCardValue(formattedName)}`);
    }

    if (data.company) {
        lines.push(`ORG;CHARSET=UTF-8:${escapeVCardValue(data.company)}`);
    }

    if (data.position) {
        lines.push(`TITLE;CHARSET=UTF-8:${escapeVCardValue(data.position)}`);
    }

    if (data.phone) {
        lines.push(`TEL;TYPE=WORK:${escapeVCardValue(data.phone)}`);
    }

    if (data.email) {
        lines.push(`EMAIL;TYPE=INTERNET:${escapeVCardValue(data.email)}`);
    }

    if (data.address) {
        lines.push(`ADR;TYPE=WORK;CHARSET=UTF-8:;;${escapeVCardValue(data.address)};;;;`);
    }

    if (data.website) {
        lines.push(`URL:${escapeVCardValue(externalURL(data.website) || data.website)}`);
    }

    lines.push("END:VCARD");

    return lines.map(foldVCardLine).join("\r\n") + "\r\n";
}

function contactFilename(data) {
    const name = [data.firstName, data.lastName].filter(Boolean).join(" ") || data.company || "contact";

    return `${name.replace(/[\\/:*?"<>|]/g, "-")}.vcf`;
}

function addContactAction(data) {
    const hasContactInformation = [
        data.firstName,
        data.lastName,
        data.company,
        data.position,
        data.phone,
        data.email,
        data.address,
        data.website
    ].some(Boolean);

    if (!hasContactInformation) {
        return;
    }

    if (contactURL) {
        URL.revokeObjectURL(contactURL);
    }

    const contact = new Blob([createVCard(data)], { type: "text/vcard;charset=utf-8" });

    contactURL = URL.createObjectURL(contact);
    addAction("Ajouter aux contacts", contactURL, false, contactFilename(data));
}

function formatAnimalBirthDate(value) {
    if (!value) {
        return "";
    }

    const date = new Date(`${value}T12:00:00`);

    return Number.isNaN(date.getTime())
        ? value
        : new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(date);
}

function addAnimalDetail(label, value, important = false) {
    if (!value) {
        return;
    }

    const item = document.createElement("div");
    const itemLabel = document.createElement("span");
    const itemValue = document.createElement("span");

    item.className = important ? "animal-detail animal-detail-important" : "animal-detail";
    itemLabel.className = "animal-detail-label";
    itemLabel.textContent = label;
    itemValue.className = "animal-detail-value";
    itemValue.textContent = value;
    item.append(itemLabel, itemValue);
    animalPreviewDetails.append(item);
}

function addAnimalCallAction(label, phone, primary = false) {
    if (!phone) {
        return;
    }

    const action = document.createElement("a");

    action.className = primary ? "animal-call-action animal-call-primary" : "animal-call-action";
    action.href = `tel:${phone.replace(/[^\d+*#(),;.-]/g, "")}`;
    action.textContent = label;
    animalPreviewActions.append(action);
}

function updateAnimalPhotoPreview() {
    if (animalPhotoURL) {
        URL.revokeObjectURL(animalPhotoURL);
        animalPhotoURL = undefined;
    }

    const [photo] = animalPhotoInput.files;

    if (!photo) {
        animalPreviewPhoto.removeAttribute("src");
        animalPreviewPhoto.hidden = true;
        return;
    }

    animalPhotoURL = URL.createObjectURL(photo);
    animalPreviewPhoto.src = animalPhotoURL;
    animalPreviewPhoto.hidden = false;
}

function renderAnimalPreview() {
    const data = {
        name: valueFor("animal-name"),
        breed: valueFor("animal-breed"),
        sex: valueFor("animal-sex"),
        birthDate: valueFor("animal-birth-date"),
        ownerName: valueFor("owner-name"),
        ownerPhone: valueFor("owner-phone"),
        ownerLocation: valueFor("owner-location"),
        emergencyName: valueFor("emergency-name"),
        emergencyPhone: valueFor("emergency-phone"),
        veterinarianName: valueFor("veterinarian-name"),
        veterinarianPhone: valueFor("veterinarian-phone"),
        importantInfo: valueFor("animal-important-info")
    };
    const birthDate = formatAnimalBirthDate(data.birthDate);
    const meta = [data.breed, data.sex, birthDate].filter(Boolean).join(" · ");

    setPreviewText(animalPreviewName, data.name);
    setPreviewText(animalPreviewMeta, meta);

    animalPreviewDetails.replaceChildren();
    addAnimalDetail("Propriétaire", data.ownerName);
    addAnimalDetail("Adresse ou commune", data.ownerLocation);
    addAnimalDetail("Contact d'urgence", data.emergencyName);
    addAnimalDetail("Vétérinaire", data.veterinarianName);
    addAnimalDetail("Informations importantes", data.importantInfo, true);
    animalPreviewDetails.hidden = !animalPreviewDetails.childElementCount;

    animalPreviewActions.replaceChildren();
    addAnimalCallAction("Appeler le propriétaire", data.ownerPhone, true);
    addAnimalCallAction("Appeler le contact d'urgence", data.emergencyPhone);
    addAnimalCallAction("Appeler le vétérinaire", data.veterinarianPhone);
    animalPreviewActions.hidden = !animalPreviewActions.childElementCount;

    updateAnimalPhotoPreview();
}

function updatePhotoPreview() {
    if (photoURL) {
        URL.revokeObjectURL(photoURL);
        photoURL = undefined;
    }

    const [photo] = photoInput.files;

    if (!photo) {
        previewPhoto.removeAttribute("src");
        previewPhoto.hidden = true;
        return;
    }

    photoURL = URL.createObjectURL(photo);
    previewPhoto.src = photoURL;
    previewPhoto.hidden = false;
}

function renderPreview() {
    const data = {
        firstName: valueFor("first-name"),
        lastName: valueFor("last-name"),
        company: valueFor("company"),
        position: valueFor("position"),
        phone: valueFor("phone"),
        email: valueFor("email"),
        address: valueFor("address"),
        website: valueFor("website"),
        description: valueFor("description"),
        linkedin: valueFor("linkedin"),
        instagram: valueFor("instagram"),
        facebook: valueFor("facebook")
    };
    const name = [data.firstName, data.lastName].filter(Boolean).join(" ");

    setPreviewText(previewName, name);
    setPreviewText(previewCompany, data.company);
    setPreviewText(previewPosition, data.position);
    setPreviewText(previewDescription, data.description);

    previewDetails.replaceChildren();
    addDetail("Téléphone", data.phone);
    addDetail("E-mail", data.email);
    addDetail("Adresse", data.address);
    addDetail("Site internet", data.website);
    previewDetails.hidden = !previewDetails.childElementCount;

    previewActions.replaceChildren();
    addContactAction(data);
    addAction("Appeler", data.phone ? `tel:${data.phone.replace(/[^\d+*#(),;.-]/g, "")}` : "");
    addAction("Envoyer un e-mail", data.email ? `mailto:${encodeURIComponent(data.email)}` : "");
    addAction("Ouvrir le site", externalURL(data.website), true);
    addAction("LinkedIn", externalURL(data.linkedin), true);
    addAction("Instagram", externalURL(data.instagram), true);
    addAction("Facebook", externalURL(data.facebook), true);
    previewActions.hidden = !previewActions.childElementCount;

    updatePhotoPreview();
}

configureDraft(businessCardForm, businessCardDraftKey);
configureDraft(animalForm, animalDraftKey);

clearBusinessCardDraftButton.addEventListener("click", () => {
    clearDraft(businessCardForm, businessCardDraftKey, "Effacer le brouillon de votre carte de visite ?");
});
clearAnimalDraftButton.addEventListener("click", () => {
    clearDraft(animalForm, animalDraftKey, "Effacer le brouillon de votre fiche animal ?");
});

openModelsButton.addEventListener("click", () => showScreen("models"));
openBusinessCardButton.addEventListener("click", () => showScreen("business-card"));
openAnimalButton.addEventListener("click", () => showScreen("animal"));
openAnimalPreviewButton.addEventListener("click", () => {
    renderAnimalPreview();
    showScreen("animal-preview");
});
openPreviewButton.addEventListener("click", () => {
    renderPreview();
    showScreen("preview");
});
goHomeButton.addEventListener("click", () => showScreen("home"));
goModelsButton.addEventListener("click", () => showScreen("models"));
goModelsFromAnimalButton.addEventListener("click", () => showScreen("models"));
editBusinessCardButton.addEventListener("click", () => showScreen("business-card"));
editAnimalButton.addEventListener("click", () => showScreen("animal"));

if ("serviceWorker" in navigator && window.isSecureContext) {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {
        // La PWA reste utilisable même si l'enregistrement échoue.
    });
}
