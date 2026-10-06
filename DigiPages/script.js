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
const editTokensKey = "digipages.edit-tokens";
const apiBaseURL = "https://patoleblog.fr/wp-json/digipages/v1/pages";
const uploadURL = "https://patoleblog.fr/wp-json/digipages/v1/upload";
const verifyMagicLinkURL = "https://patoleblog.fr/wp-json/digipages/v1/auth/verify";
const authSessionKey = "digipages.auth-session";

let currentPublishedPage;
let currentEditingPage;
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

function readEditTokens() {
    try {
        const tokens = JSON.parse(localStorage.getItem(editTokensKey) || "{}");

        return tokens && typeof tokens === "object" ? tokens : {};
    } catch {
        return {};
    }
}

function editTokenFor(publicID) {
    return readEditTokens()[publicID] || "";
}

function saveEditToken(publicID, editToken) {
    try {
        const tokens = readEditTokens();

        tokens[publicID] = editToken;
        localStorage.setItem(editTokensKey, JSON.stringify(tokens));
        return true;
    } catch {
        return false;
    }
}

function readAuthSession() {
    try {
        const session = JSON.parse(localStorage.getItem(authSessionKey) || "");

        return session
            && typeof session.sessionToken === "string"
            && typeof session.email === "string"
            ? session
            : null;
    } catch {
        return null;
    }
}

function saveAuthSession(session) {
    try {
        localStorage.setItem(authSessionKey, JSON.stringify(session));
        return true;
    } catch {
        return false;
    }
}

function clearAuthSession() {
    try {
        localStorage.removeItem(authSessionKey);
    } catch {
        // The interface remains usable if local storage is unavailable.
    }
}

function isAuthenticated() {
    return Boolean(readAuthSession());
}

function removeMagicLinkFromURL() {
    const url = new URL(window.location.href);

    url.search = "";
    url.hash = "";
    window.history.replaceState({}, "", url.pathname);
}

function showAuthenticationMessage(message, canReturnHome = false) {
    const card = createElement("article", "public-card", message);

    if (canReturnHome) {
        const button = createElement("button", "secondary-button", "Revenir à l’accueil");

        button.type = "button";
        button.addEventListener("click", () => showScreen("home"));
        card.append(button);
    }

    publicContent.replaceChildren(publicBrand(), card);
    showScreen("public");
}

async function verifyMagicLink(token) {
    showAuthenticationMessage("Connexion en cours…");

    try {
        const response = await fetch(verifyMagicLinkURL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token })
        });

        if (!response.ok) {
            throw new Error("invalid-magic-link");
        }

        const result = await response.json();

        if (!result || typeof result.session_token !== "string" || typeof result.user?.email !== "string") {
            throw new Error("invalid-magic-link");
        }

        if (!saveAuthSession({ sessionToken: result.session_token, email: result.user.email })) {
            throw new Error("invalid-magic-link");
        }

        removeMagicLinkFromURL();
        showAuthenticationMessage("Connexion réussie");

        window.setTimeout(() => showScreen("home"), 1200);
    } catch {
        removeMagicLinkFromURL();
        showAuthenticationMessage("Ce lien de connexion est invalide ou a expiré.", true);
    }
}

function appBasePath() {
    const path = window.location.pathname;

    return path.endsWith("/") ? path : `${path}/`;
}

function publicationURLFor(id) {
    return new URL(appBasePath() + "?p=" + encodeURIComponent(id), window.location.origin).href;
}

function publicationIDFromURL() {
    const params = new URLSearchParams(window.location.search);

    return (params.get("p") || "").trim();
}

const maxPhotoDimension = 1600;
const photoJPEGQuality = 0.8;

function optimizedImageBlob(input) {
    const [file] = input.files;

    if (!file) {
        return Promise.resolve(null);
    }

    if (!file.type.startsWith("image/")) {
        return Promise.reject(new Error("invalid-image"));
    }

    return new Promise((resolve, reject) => {
        const image = new Image();
        const sourceURL = URL.createObjectURL(file);

        image.addEventListener("load", () => {
            URL.revokeObjectURL(sourceURL);

            const largestDimension = Math.max(image.naturalWidth, image.naturalHeight);

            if (!largestDimension) {
                reject(new Error("invalid-image"));
                return;
            }

            const scale = Math.min(1, maxPhotoDimension / largestDimension);
            const width = Math.max(1, Math.round(image.naturalWidth * scale));
            const height = Math.max(1, Math.round(image.naturalHeight * scale));
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");

            if (!context) {
                reject(new Error("invalid-image"));
                return;
            }

            canvas.width = width;
            canvas.height = height;
            context.fillStyle = "#ffffff";
            context.fillRect(0, 0, width, height);
            context.drawImage(image, 0, 0, width, height);
            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error("invalid-image"));
                }
            }, "image/jpeg", photoJPEGQuality);
        });
        image.addEventListener("error", () => {
            URL.revokeObjectURL(sourceURL);
            reject(new Error("invalid-image"));
        });
        image.src = sourceURL;
    });
}

async function uploadImage(blob) {
    const formData = new FormData();

    formData.append("file", blob, "digipages-photo.jpg");

    try {
        const response = await fetch(uploadURL, {
            method: "POST",
            body: formData
        });

        if (!response.ok) {
            throw new Error("upload-failed");
        }

        const result = await response.json();

        if (!result || typeof result.url !== "string" || !result.url) {
            throw new Error("upload-failed");
        }

        return result.url;
    } catch {
        throw new Error("upload-failed");
    }
}

function businessCardData() {
    return {
        firstName: valueFor("first-name"),
        lastName: valueFor("last-name"),
        company: valueFor("company"),
        position: valueFor("position"),
        phone: valueFor("phone"),
        email: valueFor("email"),
        streetAddress: valueFor("street-address"),
        postalCode: valueFor("postal-code"),
        city: valueFor("city"),
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
        ownerAddress: valueFor("owner-address"),
        ownerPostalCode: valueFor("owner-postal-code"),
        ownerCity: valueFor("owner-city"),
        emergencyName: valueFor("emergency-name"),
        emergencyPhone: valueFor("emergency-phone"),
        veterinarianName: valueFor("veterinarian-name"),
        veterinarianPhone: valueFor("veterinarian-phone"),
        importantInfo: valueFor("animal-important-info")
    };
}

function formattedAddress(data, streetKey, postalCodeKey, cityKey, legacyKey) {
    const streetAddress = typeof data[streetKey] === "string" ? data[streetKey].trim() : "";
    const postalCode = typeof data[postalCodeKey] === "string" ? data[postalCodeKey].trim() : "";
    const city = typeof data[cityKey] === "string" ? data[cityKey].trim() : "";
    const locality = [postalCode, city].filter(Boolean).join(" ");

    if (streetAddress || locality) {
        return [streetAddress, locality].filter(Boolean).join("\n");
    }

    return typeof data[legacyKey] === "string" ? data[legacyKey].trim() : "";
}

function businessAddress(data) {
    return formattedAddress(data, "streetAddress", "postalCode", "city", "address");
}

function ownerAddress(data) {
    return formattedAddress(data, "ownerAddress", "ownerPostalCode", "ownerCity", "ownerLocation");
}

function normalizeBackendPage(page) {
    const data = page && typeof page.data === "object" && page.data ? page.data : {};
    const photo = typeof page.image_url === "string" ? page.image_url : "";

    return {
        id: page.public_id,
        type: page.page_type,
        data,
        photo,
        createdAt: page.created_at,
        updatedAt: page.updated_at
    };
}

async function requestPage(path = "", options = {}) {
    const response = await fetch(apiBaseURL + path, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        }
    });

    if (!response.ok) {
        const error = new Error("request-failed");

        error.status = response.status;
        throw error;
    }

    return response.json();
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

    detailValue.style.whiteSpace = "pre-line";
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
    appendPublicDetail(details, "Adresse", businessAddress(data));
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
    appendPublicDetail(details, "Adresse", ownerAddress(data));
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
    const card = page.type === "animal"
        ? renderAnimalPublicPage(page)
        : renderBusinessCardPublicPage(page);
    const elements = [publicBrand(), card];

    if (editTokenFor(page.id)) {
        const editButton = createElement("button", "text-button", "Modifier cette page");

        editButton.type = "button";
        editButton.addEventListener("click", () => startEditingPage(page));
        elements.push(editButton);
    }

    publicContent.replaceChildren(...elements);
}

function showPublicMessage(message) {
    publicContent.replaceChildren(
        publicBrand(),
        createElement("article", "public-card", message)
    );
    showScreen("public");
}

function showPublicationConfirmation(page) {
    currentPublishedPage = page;
    currentEditingPage = page;
    const url = publicationURLFor(page.id);

    publishedURL.href = url;
    publishedURL.textContent = url;
    editPublishedPageButton.hidden = !editTokenFor(page.id);
    showScreen("published");
}

function pagePayload(type, imageURL) {
    const data = type === "animal" ? animalData() : businessCardData();

    return {
        page_type: type,
        data,
        image_url: imageURL || null
    };
}

async function publishPage(type) {
    const button = type === "animal" ? publishAnimalButton : publishBusinessCardButton;
    const originalLabel = button.textContent;
    const token = currentEditingPage && currentEditingPage.type === type
        ? editTokenFor(currentEditingPage.id)
        : "";

    button.disabled = true;
    button.textContent = "Publication…";

    try {
        const imageInput = type === "animal" ? animalPhotoInput : photoInput;
        const imageBlob = await optimizedImageBlob(imageInput);
        let imageURL = currentEditingPage && currentEditingPage.type === type
            ? currentEditingPage.photo
            : "";

        if (imageBlob) {
            imageURL = await uploadImage(imageBlob);
            imageInput.value = "";
        }

        const payload = pagePayload(type, imageURL);
        const response = token
            ? await requestPage("/" + currentEditingPage.id, {
                method: "PUT",
                headers: { "X-DigiPages-Edit-Token": token },
                body: JSON.stringify(payload)
            })
            : await requestPage("", {
                method: "POST",
                body: JSON.stringify(payload)
            });
        const page = normalizeBackendPage(response);

        if (response.edit_token) {
            saveEditToken(page.id, response.edit_token);
        }

        showPublicationConfirmation(page);
    } catch (error) {
        if (error.message === "invalid-image") {
            window.alert("Cette photo n’est pas valide. Choisissez une image puis réessayez.");
        } else if (error.message === "upload-failed") {
            window.alert("L’envoi de la photo a échoué. Réessayez avec une autre image.");
        } else if (token && error.status === 403) {
            window.alert("La modification a été refusée.");
        } else if (error.status) {
            window.alert("La publication est impossible pour le moment. Réessayez plus tard.");
        } else {
            window.alert("Le serveur est indisponible. Vérifiez votre connexion et réessayez.");
        }
    } finally {
        button.disabled = false;
        button.textContent = originalLabel;
    }
}

async function openPublishedPage() {
    if (!currentPublishedPage) {
        return;
    }

    window.history.pushState({}, "", publicationURLFor(currentPublishedPage.id));
    await loadPublicationFromURL();
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

function setFormValues(values) {
    Object.entries(values).forEach(([id, value]) => {
        const field = document.querySelector("#" + id);

        if (field && typeof value === "string") {
            field.value = value;
        }
    });
}

function startEditingPage(page) {
    currentEditingPage = page;

    if (page.type === "animal") {
        setFormValues({
            "animal-name": page.data.name,
            "animal-breed": page.data.breed,
            "animal-sex": page.data.sex,
            "animal-birth-date": page.data.birthDate,
            "owner-name": page.data.ownerName,
            "owner-phone": page.data.ownerPhone,
            "owner-address": page.data.ownerAddress || page.data.ownerLocation,
            "owner-postal-code": page.data.ownerPostalCode,
            "owner-city": page.data.ownerCity,
            "emergency-name": page.data.emergencyName,
            "emergency-phone": page.data.emergencyPhone,
            "veterinarian-name": page.data.veterinarianName,
            "veterinarian-phone": page.data.veterinarianPhone,
            "animal-important-info": page.data.importantInfo
        });
        showScreen("animal");
        return;
    }

    setFormValues({
        "first-name": page.data.firstName,
        "last-name": page.data.lastName,
        company: page.data.company,
        position: page.data.position,
        phone: page.data.phone,
        email: page.data.email,
        "street-address": page.data.streetAddress || page.data.address,
        "postal-code": page.data.postalCode,
        city: page.data.city,
        website: page.data.website,
        description: page.data.description,
        linkedin: page.data.linkedin,
        instagram: page.data.instagram,
        facebook: page.data.facebook
    });
    showScreen("business-card");
}

function editPublishedPage() {
    if (currentPublishedPage && editTokenFor(currentPublishedPage.id)) {
        startEditingPage(currentPublishedPage);
    }
}

async function loadPublicationFromURL() {
    const id = publicationIDFromURL();

    if (!id) {
        return false;
    }

    showPublicMessage("Chargement de la page…");

    try {
        const page = normalizeBackendPage(await requestPage("/" + id.toLowerCase()));

        currentPublishedPage = page;
        renderPublicPage(page);
    } catch (error) {
        showPublicMessage(error.status === 404
            ? "Cette page est introuvable."
            : "Le serveur est indisponible. Réessayez plus tard.");
    }

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
    itemValue.style.whiteSpace = "pre-line";
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

    const streetAddress = typeof data.streetAddress === "string" ? data.streetAddress : (data.address || "");
    const city = typeof data.city === "string" ? data.city : "";
    const postalCode = typeof data.postalCode === "string" ? data.postalCode : "";

    if (streetAddress || city || postalCode) {
        lines.push(`ADR;TYPE=WORK;CHARSET=UTF-8:;;${escapeVCardValue(streetAddress)};${escapeVCardValue(city)};;${escapeVCardValue(postalCode)};`);
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
        businessAddress(data),
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
    itemValue.style.whiteSpace = "pre-line";
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
    const source = photo
        ? URL.createObjectURL(photo)
        : (currentEditingPage && currentEditingPage.type === "animal" ? currentEditingPage.photo : "");

    if (!source) {
        animalPreviewPhoto.removeAttribute("src");
        animalPreviewPhoto.hidden = true;
        return;
    }

    animalPhotoURL = photo ? source : undefined;
    animalPreviewPhoto.src = source;
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
        ownerAddress: valueFor("owner-address"),
        ownerPostalCode: valueFor("owner-postal-code"),
        ownerCity: valueFor("owner-city"),
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
    addAnimalDetail("Adresse", ownerAddress(data));
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
    const source = photo
        ? URL.createObjectURL(photo)
        : (currentEditingPage && currentEditingPage.type === "business-card" ? currentEditingPage.photo : "");

    if (!source) {
        previewPhoto.removeAttribute("src");
        previewPhoto.hidden = true;
        return;
    }

    photoURL = photo ? source : undefined;
    previewPhoto.src = source;
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
        streetAddress: valueFor("street-address"),
        postalCode: valueFor("postal-code"),
        city: valueFor("city"),
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
    addDetail("Adresse", businessAddress(data));
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
openBusinessCardButton.addEventListener("click", () => {
    currentEditingPage = undefined;
    showScreen("business-card");
});
openAnimalButton.addEventListener("click", () => {
    currentEditingPage = undefined;
    showScreen("animal");
});
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

async function initializeApplication() {
    const magicToken = new URLSearchParams(window.location.search).get("magic");

    if (magicToken) {
        await verifyMagicLink(magicToken);
        return;
    }

    if (!await loadPublicationFromURL()) {
        showScreen("home");
    }
}

window.addEventListener("popstate", async () => {
    await initializeApplication();
});

initializeApplication();

if ("serviceWorker" in navigator && window.isSecureContext) {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {
        // La PWA reste utilisable même si l'enregistrement échoue.
    });
}
