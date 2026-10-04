const homeScreen = document.querySelector('[data-screen="home"]');
const modelsScreen = document.querySelector('[data-screen="models"]');
const businessCardScreen = document.querySelector('[data-screen="business-card"]');
const previewScreen = document.querySelector('[data-screen="preview"]');
const animalScreen = document.querySelector('[data-screen="animal"]');
const animalPreviewScreen = document.querySelector('[data-screen="animal-preview"]');
const publishedScreen = document.querySelector('[data-screen="published"]');
const publicScreen = document.querySelector('[data-screen="public"]');
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
const publishBusinessCardButton = document.querySelector('[data-action="publish-business-card"]');
const publishAnimalButton = document.querySelector('[data-action="publish-animal"]');
const openPublishedPageButton = document.querySelector('[data-action="open-published-page"]');
const copyPublishedLinkButton = document.querySelector('[data-action="copy-published-link"]');
const editPublishedPageButton = document.querySelector('[data-action="edit-published-page"]');
const publishedURL = document.querySelector('[data-published-url]');
const publicContent = document.querySelector('[data-public-content]');
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
const publishedPagesKey = "digipages.published-pages";

let currentPublishedPage;
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
        "animal-preview": animalPreviewScreen,
        published: publishedScreen,
        public: publicScreen
    };
    const nextScreen = screens[screen];

    Object.values(screens).forEach((element) => {
        element.hidden = element !== nextScreen;
    });

    window.scrollTo(0, 0);
}

function readPublishedPages() {
    try {
        const pages = JSON.parse(localStorage.getItem(publishedPagesKey) || "{}");

        return pages && typeof pages === "object" ? pages : {};
    } catch {
        return {};
    }
}

function publicationID() {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const values = new Uint8Array(6);

    if (window.crypto?.getRandomValues) {
        window.crypto.getRandomValues(values);
    } else {
        values.forEach((_, index) => {
            values[index] = Math.floor(Math.random() * 256);
        });
    }

    return Array.from(values, (value) => alphabet[value % alphabet.length]).join("");
}

function appBasePath() {
    const [path] = window.location.pathname.split("/p/");

    return path.endsWith("/") ? path : `${path}/`;
}

function publicationPath(id) {
    return `${appBasePath()}p/${id}`;
}

function publicationURLFor(id) {
    return new URL(publicationPath(id), window.location.origin).href;
}

function publicationIDFromPath() {
    const match = window.location.pathname.match(/\/p\/([A-Z0-9]+)\/?$/i);

    return match ? match[1].toUpperCase() : "";
}

function fileAsDataURL(input) {
    const [file] = input.files;

    if (!file) {
        return Promise.resolve("");
    }

    return new Promise((resolve) => {
        const reader = new FileReader();

        reader.addEventListener("load", () => resolve(typeof reader.result === "string" ? reader.result : ""));
        reader.addEventListener("error", () => resolve(""));
        reader.readAsDataURL(file);
    });
}

function businessCardData() {
    return {
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
}

function animalData() {
    return {
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
}

function savePublishedPage(page) {
    const pages = readPublishedPages();

    pages[page.id] = page;

    try {
        localStorage.setItem(publishedPagesKey, JSON.stringify(pages));
        return true;
    } catch {
        return false;
    }
}

function createElement(tagName, className = "", text = "") {
    const element = document.createElement(tagName);

    if (className) {
        element.className = className;
    }

    if (text) {
        element.textContent = text;
    }

    return element;
}

function appendPublicDetail(container, label, value, important = false) {
    if (!value) {
        return;
    }

    const detail = createElement("div", important ? "animal-detail animal-detail-important" : "preview-detail");
    const detailLabel = createElement("span", important ? "animal-detail-label" : "preview-detail-label", label);
    const detailValue = createElement("span", important ? "animal-detail-value" : "preview-detail-value", value);

    detail.append(detailLabel, detailValue);
    container.append(detail);
}

function appendPublicAction(container, label, href, primary = false) {
    if (!href) {
        return;
    }

    const action = createElement("a", primary ? "animal-call-action animal-call-primary" : "preview-action", label);

    action.href = href;

    if (/^https?:/i.test(href)) {
        action.target = "_blank";
        action.rel = "noopener noreferrer";
    }

    container.append(action);
}

function publicBrand() {
    const brand = createElement("div", "brand");
    const logo = document.createElement("img");

    logo.src = new URL("icons/icon-192.png", `${window.location.origin}${appBasePath()}`).href;
    logo.alt = "";
    logo.width = 32;
    logo.height = 32;
    brand.append(logo, document.createTextNode("DigiPages"));

    return brand;
}

function renderBusinessCardPublicPage(page) {
    const { data, photo } = page;
    const article = createElement("article", "digital-card public-card");
    const name = [data.firstName, data.lastName].filter(Boolean).join(" ") || data.company || "Carte de visite";
    const identity = createElement("div", "preview-identity");

    if (photo) {
        const image = createElement("img", "preview-photo");

        image.src = photo;
        image.alt = "";
        article.append(image);
    }

    identity.append(createElement("h1", "", name));

    if (data.company) {
        identity.append(createElement("p", "preview-company", data.company));
    }

    if (data.position) {
        identity.append(createElement("p", "preview-position", data.position));
    }

    article.append(identity);

    if (data.description) {
        article.append(createElement("p", "preview-description", data.description));
    }

    const details = createElement("div", "preview-details");

    appendPublicDetail(details, "Téléphone", data.phone);
    appendPublicDetail(details, "E-mail", data.email);
    appendPublicDetail(details, "Adresse", data.address);
    appendPublicDetail(details, "Site internet", data.website);

    if (details.childElementCount) {
        article.append(details);
    }

    const actions = createElement("div", "preview-actions");

    appendPublicAction(actions, "Appeler", data.phone ? `tel:${data.phone.replace(/[^\d+*#(),;.-]/g, "")}` : "");
    appendPublicAction(actions, "Envoyer un e-mail", data.email ? `mailto:${encodeURIComponent(data.email)}` : "");
    appendPublicAction(actions, "Ouvrir le site", externalURL(data.website));
    appendPublicAction(actions, "LinkedIn", externalURL(data.linkedin));
    appendPublicAction(actions, "Instagram", externalURL(data.instagram));
    appendPublicAction(actions, "Facebook", externalURL(data.facebook));

    if (actions.childElementCount) {
        article.append(actions);
    }

    return article;
}

function renderAnimalPublicPage(page) {
    const { data, photo } = page;
    const article = createElement("article", "animal-profile public-card");
    const header = createElement("div", "animal-profile-header");
    const meta = [data.breed, data.sex, formatAnimalBirthDate(data.birthDate)].filter(Boolean).join(" · ");

    if (photo) {
        const image = createElement("img", "animal-preview-photo");

        image.src = photo;
        image.alt = data.name ? `Photo de ${data.name}` : "";
        article.append(image);
    }

    header.append(createElement("p", "animal-profile-eyebrow", "Fiche d'identification"));
    header.append(createElement("h1", "", data.name || "Mon animal"));

    if (meta) {
        header.append(createElement("p", "animal-profile-meta", meta));
    }

    article.append(header);

    const details = createElement("div", "animal-profile-details");

    appendPublicDetail(details, "Propriétaire", data.ownerName);
    appendPublicDetail(details, "Adresse ou commune", data.ownerLocation);
    appendPublicDetail(details, "Contact d'urgence", data.emergencyName);
    appendPublicDetail(details, "Vétérinaire", data.veterinarianName);
    appendPublicDetail(details, "Informations importantes", data.importantInfo, true);

    if (details.childElementCount) {
        article.append(details);
    }

    const actions = createElement("div", "animal-profile-actions");

    appendPublicAction(actions, "Appeler le propriétaire", data.ownerPhone ? `tel:${data.ownerPhone.replace(/[^\d+*#(),;.-]/g, "")}` : "", true);
    appendPublicAction(actions, "Appeler le contact d'urgence", data.emergencyPhone ? `tel:${data.emergencyPhone.replace(/[^\d+*#(),;.-]/g, "")}` : "");
    appendPublicAction(actions, "Appeler le vétérinaire", data.veterinarianPhone ? `tel:${data.veterinarianPhone.replace(/[^\d+*#(),;.-]/g, "")}` : "");

    if (actions.childElementCount) {
        article.append(actions);
    }

    return article;
}

function renderPublicPage(page) {
    publicContent.replaceChildren(publicBrand(), page.type === "animal"
        ? renderAnimalPublicPage(page)
        : renderBusinessCardPublicPage(page));
}

function showPublicationConfirmation(page) {
    currentPublishedPage = page;
    const url = publicationURLFor(page.id);

    publishedURL.href = url;
    publishedURL.textContent = url;
    showScreen("published");
}

async function publishPage(type) {
    const pages = readPublishedPages();
    let id = publicationID();

    while (pages[id]) {
        id = publicationID();
    }

    const isAnimal = type === "animal";
    const page = {
        id,
        type: isAnimal ? "animal" : "business-card",
        createdAt: new Date().toISOString(),
        data: isAnimal ? animalData() : businessCardData(),
        photo: await fileAsDataURL(isAnimal ? animalPhotoInput : photoInput)
    };

    if (!savePublishedPage(page)) {
        if (page.photo) {
            page.photo = "";

            if (savePublishedPage(page)) {
                window.alert("La page a été publiée, mais la photo n'a pas pu être enregistrée localement.");
                showPublicationConfirmation(page);
                return;
            }
        }

        window.alert("La publication n'a pas pu être enregistrée localement.");
        return;
    }

    showPublicationConfirmation(page);
}

function openPublishedPage() {
    if (!currentPublishedPage) {
        return;
    }

    window.history.pushState({}, "", publicationPath(currentPublishedPage.id));
    renderPublicPage(currentPublishedPage);
    showScreen("public");
}

async function copyPublishedLink() {
    if (!currentPublishedPage) {
        return;
    }

    const url = publicationURLFor(currentPublishedPage.id);

    try {
        await navigator.clipboard.writeText(url);
        copyPublishedLinkButton.textContent = "Lien copié";
    } catch {
        window.prompt("Copiez ce lien :", url);
    }
}

function editPublishedPage() {
    if (!currentPublishedPage) {
        return;
    }

    showScreen(currentPublishedPage.type === "animal" ? "animal" : "business-card");
}

function loadPublicationFromURL() {
    const id = publicationIDFromPath();

    if (!id) {
        return false;
    }

    const page = readPublishedPages()[id];

    if (!page) {
        return false;
    }

    currentPublishedPage = page;
    renderPublicPage(page);
    showScreen("public");

    return true;
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
publishBusinessCardButton.addEventListener("click", () => publishPage("business-card"));
publishAnimalButton.addEventListener("click", () => publishPage("animal"));
openPublishedPageButton.addEventListener("click", openPublishedPage);
copyPublishedLinkButton.addEventListener("click", copyPublishedLink);
editPublishedPageButton.addEventListener("click", editPublishedPage);

window.addEventListener("popstate", () => {
    if (!loadPublicationFromURL()) {
        showScreen("home");
    }
});

loadPublicationFromURL();

if ("serviceWorker" in navigator && window.isSecureContext) {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {
        // La PWA reste utilisable même si l'enregistrement échoue.
    });
}
