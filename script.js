const CURRENCY = "FCFA";
const MAX_PARTICIPANTS = 100;
const MAX_NAME_LENGTH = 50;
const STORAGE_KEY = "ordrex_last_draw";

const participantsInput = document.getElementById("participants");
const participantCount = document.getElementById("participantCount");

const drawButton = document.getElementById("drawButton");
const animationBox = document.getElementById("animationBox");

const resultSection = document.getElementById("resultSection");
const resultTable = document.getElementById("resultTable");

const tontineNameInput = document.getElementById("tontineName");
const amountInput = document.getElementById("amount");

const resultInfo = document.getElementById("resultInfo");
const drawIdDisplay = document.getElementById("drawIdDisplay");

const pdfButton = document.getElementById("pdfButton");
const whatsappButton = document.getElementById("whatsappButton");
const shareButton = document.getElementById("shareButton");
const newDrawButton = document.getElementById("newDrawButton");
const closeSharedButton = document.getElementById("closeSharedButton");
const sharedBanner = document.getElementById("sharedBanner");

let finalResults = [];
let currentDraw = null;

/* ============================
   SANITIZATION
============================ */
function sanitizeSharedData(data) {
    if (!data || typeof data !== "object") return null;
    if (!Array.isArray(data.results) || data.results.length === 0) return null;
    if (data.results.length > MAX_PARTICIPANTS) return null;

    const cleanResults = data.results
        .filter(name => typeof name === "string")
        .map(name => name.trim().substring(0, MAX_NAME_LENGTH))
        .filter(name => name !== "");

    if (cleanResults.length === 0) return null;

    return {
        id: typeof data.id === "string" ? data.id.substring(0, 20) : "",
        drawName: typeof data.drawName === "string" ? data.drawName.substring(0, 50) : "Tirage OrdreX",
        amount: typeof data.amount === "string" || typeof data.amount === "number" ? String(data.amount).substring(0, 15) : "",
        results: cleanResults,
        date: typeof data.date === "string" ? data.date.substring(0, 30) : new Date().toISOString()
    };
}

/* ============================
   COMPTER LES PARTICIPANTS
============================ */
participantsInput.addEventListener("input", updateParticipantCount);

function getParticipants() {
    return participantsInput.value
        .split("\n")
        .map(name => name.trim())
        .filter(name => name !== "");
}

function updateParticipantCount() {
    const participants = getParticipants();
    participantCount.textContent = participants.length;
}

/* ============================
   GENERER UN ID DE TIRAGE
============================ */
function generateDrawId() {
    const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let randomPart = "";
    for (let i = 0; i < 6; i++) {
        randomPart += characters[Math.floor(Math.random() * characters.length)];
    }
    const year = new Date().getFullYear();
    return `ORDX-${year}-${randomPart}`;
}

/* ============================
   LANCER LE TIRAGE
============================ */
drawButton.addEventListener("click", startDraw);

function startDraw() {
    const participants = getParticipants();

    if (participants.length < 2) {
        alert("Veuillez entrer au moins 2 participants.");
        return;
    }

    /* Vérification des doublons */
    const normalized = participants.map(name => name.toLowerCase());
    const uniqueNames = new Set(normalized);

    if (uniqueNames.size !== participants.length) {
        alert("Attention : certains participants sont inscrits plusieurs fois.");
        return;
    }

    // Limit checks
    if (participants.length > MAX_PARTICIPANTS) {
        alert(`Le nombre maximum de participants est de ${MAX_PARTICIPANTS}.`);
        return;
    }

    const tooLong = participants.filter(name => name.length > MAX_NAME_LENGTH);
    if (tooLong.length > 0) {
        alert(`Certains noms dépassent ${MAX_NAME_LENGTH} caractères : ${tooLong.join(", ")}`);
        return;
    }

    const drawName = tontineNameInput.value.trim() || "Tirage OrdreX";
    const amount = amountInput.value;

    drawButton.disabled = true;
    animationBox.classList.remove("hidden");
    resultSection.classList.add("hidden");

    /* Le tirage est effectué une seule fois après l'animation. */
    setTimeout(() => {
        finalResults = shuffleArray(participants);

        currentDraw = {
            id: generateDrawId(),
            drawName: drawName,
            amount: amount || "",
            participants: participants,
            results: finalResults,
            date: new Date().toISOString()
        };

        /* Sauvegarde locale */
        saveDraw();

        displayResults(finalResults, drawName, currentDraw.id);

        animationBox.classList.add("hidden");
        drawButton.disabled = false;
    }, 2500);
}

/* ============================
   MELANGE ALEATOIRE
   Fisher-Yates
============================ */
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const randomIndex = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[i]];
    }
    return shuffled;
}

/* ============================
   SAUVEGARDER LE TIRAGE
============================ */
function saveDraw() {
    if (!currentDraw) return;

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(currentDraw));
    } catch (error) {
        console.error("Impossible de sauvegarder le tirage :", error);
    }
}

/* ============================
   RECUPERER LE DERNIER TIRAGE
============================ */
function loadLastDraw() {
    try {
        const savedDraw = localStorage.getItem(STORAGE_KEY);
        if (!savedDraw) return;

        const rawData = JSON.parse(savedDraw);
        const draw = sanitizeSharedData(rawData);

        if (!draw) return;

        currentDraw = draw;
        finalResults = draw.results;

        /* On recharge également les informations du tirage. */
        tontineNameInput.value = draw.drawName || "";
        amountInput.value = draw.amount || "";

        displayResults(draw.results, draw.drawName, draw.id);
    } catch (error) {
        console.error("Impossible de récupérer le dernier tirage :", error);
    }
}

/* ============================
   AFFICHER LES RESULTATS
============================ */
function displayResults(results, drawName, drawId) {
    resultTable.innerHTML = "";

    results.forEach((name, index) => {
        const row = document.createElement("tr");
        
        const numberCell = document.createElement("td");
        numberCell.textContent = String(index + 1).padStart(2, "0");

        const nameCell = document.createElement("td");
        nameCell.textContent = name;

        row.appendChild(numberCell);
        row.appendChild(nameCell);
        resultTable.appendChild(row);
    });

    const amount = (currentDraw && currentDraw.amount) ? currentDraw.amount : amountInput.value;
    let info = `${drawName} • ${results.length} participant(s)`;

    if (amount) {
        const formattedAmount = Number(amount).toLocaleString("fr-FR");
        info += ` • ${formattedAmount} ${CURRENCY}`;
    }

    resultInfo.textContent = info;

    if (drawId) {
        drawIdDisplay.textContent = `ID du tirage : ${drawId}`;
    }

    resultSection.classList.remove("hidden");
    resultSection.scrollIntoView({ behavior: "smooth" });
}

/* ============================
/* ============================
   UTILITAIRES DE PARTAGE
============================ */
function getBaseUrl() {
    if (window.location.protocol === "file:" || !window.location.origin || window.location.origin === "null") {
        return window.location.href.split("#")[0].split("?")[0];
    }
    return `${window.location.origin}${window.location.pathname}`;
}

function buildShareUrl() {
    if (!currentDraw) return "";
    const shareData = {
        id: currentDraw.id,
        drawName: currentDraw.drawName,
        amount: currentDraw.amount,
        results: currentDraw.results,
        date: currentDraw.date
    };
    const encodedData = encodeData(shareData);
    return `${getBaseUrl()}#result=${encodedData}`;
}

function buildShareMessage(draw, shareUrl) {
    let amountText = "";
    if (draw.amount) {
        const cleanAmount = Number(String(draw.amount).replace(/\s/g, ""));
        if (!isNaN(cleanAmount) && cleanAmount > 0) {
            amountText = `\nMontant : ${cleanAmount.toLocaleString("fr-FR")} ${CURRENCY}`;
        }
    }

    const showAll = draw.results.length <= 25;
    const previewList = showAll ? draw.results : draw.results.slice(0, 15);

    let listText = previewList
        .map((name, i) => `${String(i + 1).padStart(2, "0")}. ${name}`)
        .join("\n");

    if (!showAll) {
        listText += `\n... et ${draw.results.length - 15} autre(s) participant(s)`;
    }

    return `*OrdreX — Résultat du tirage*\n` +
        `*${draw.drawName}*${amountText}\n` +
        `ID : ${draw.id}\n\n` +
        `*Ordre de passage :*\n${listText}\n\n` +
        `*Consulter ou exporter en PDF :*\n${shareUrl}`;
}

async function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (e) {
            console.warn("Clipboard API error", e);
        }
    }
    try {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.top = "-9999px";
        textArea.style.left = "-9999px";
        textArea.setAttribute("readonly", "");
        document.body.appendChild(textArea);
        textArea.select();
        textArea.setSelectionRange(0, 99999);
        const successful = document.execCommand("copy");
        document.body.removeChild(textArea);
        if (successful) return true;
    } catch (e) {
        console.warn("execCommand error", e);
    }
    return false;
}

function showToast(message) {
    const existing = document.querySelector(".toast");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/* ============================
   PARTAGER LE RESULTAT
============================ */
if (whatsappButton) {
    whatsappButton.addEventListener("click", shareWhatsApp);
}

function shareWhatsApp() {
    if (!currentDraw || finalResults.length === 0) {
        alert("Aucun résultat à partager.");
        return;
    }

    const shareUrl = buildShareUrl();
    const message = buildShareMessage(currentDraw, shareUrl);
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;

    window.open(whatsappUrl, "_blank");
}

shareButton.addEventListener("click", shareResult);

async function shareResult() {
    if (!currentDraw || finalResults.length === 0) {
        alert("Aucun résultat à partager.");
        return;
    }

    const shareUrl = buildShareUrl();
    const shareMessage = buildShareMessage(currentDraw, shareUrl);

    // 1. Sur mobile, essayer le partage natif (Web Share API)
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile && navigator.share) {
        try {
            await navigator.share({
                title: `Résultat OrdreX — ${currentDraw.drawName}`,
                text: shareMessage,
                url: shareUrl
            });
            return;
        } catch (error) {
            if (error.name === "AbortError") return;
        }
    }

    // 2. Sur ordinateur ou en fallback, copier le lien dans le presse-papier
    const copied = await copyToClipboard(shareUrl);
    if (copied) {
        showToast("Lien copié dans le presse-papier !");
    } else {
        prompt("Copiez ce lien pour partager le résultat :", shareUrl);
    }

    // 3. Avertissement si exécution depuis un fichier local file:///
    if (window.location.protocol === "file:") {
        setTimeout(() => {
            alert("Note : Vous utilisez un fichier local. Pour que d'autres personnes puissent ouvrir ce lien, publiez le site sur Internet (ex: Vercel, GitHub Pages).");
        }, 600);
    }
}

/* ============================
   ENCODER LES DONNEES
============================ */
function encodeData(data) {
    const json = JSON.stringify(data);
    const bytes = new TextEncoder().encode(json);
    let binary = "";
    bytes.forEach(byte => {
        binary += String.fromCharCode(byte);
    });
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/* ============================
   DECODER LES DONNEES
============================ */
function decodeData(encoded) {
    if (!encoded || typeof encoded !== "string") return null;
    try {
        let clean = encoded.trim().replace(/\s+/g, "");
        const base64 = clean.replace(/-/g, "+").replace(/_/g, "/");
        const padLength = (4 - base64.length % 4) % 4;
        if (padLength === 3) return null;
        const binary = atob(base64 + "=".repeat(padLength));
        const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
        const json = new TextDecoder().decode(bytes);
        return JSON.parse(json);
    } catch (error) {
        console.error("Lien OrdreX invalide :", error);
        return null;
    }
}

/* ============================
   CHARGER UN RESULTAT PARTAGE
============================ */
function getSharedToken() {
    // 1. Dans les paramètres d'URL (?result=...)
    if (window.location.search) {
        const urlParams = new URLSearchParams(window.location.search);
        const res = urlParams.get("result");
        if (res) return decodeURIComponent(res).trim();
    }

    // 2. Dans le hash (#result=...)
    if (window.location.hash) {
        const hash = window.location.hash.substring(1);
        if (hash.startsWith("result=")) {
            const token = hash.substring("result=".length).split("&")[0].split("?")[0];
            if (token) return decodeURIComponent(token).trim();
        }
        const hashParams = new URLSearchParams(hash);
        const res = hashParams.get("result");
        if (res) return decodeURIComponent(res).trim();
    }

    // 3. Fallback regex sur toute l'URL
    const match = window.location.href.match(/[#?&]result=([^&#\s]+)/);
    if (match && match[1]) {
        return decodeURIComponent(match[1]).trim();
    }

    return null;
}

function loadSharedResult() {
    const token = getSharedToken();
    if (!token) return false;

    const rawData = decodeData(token);
    const sharedDraw = sanitizeSharedData(rawData);

    if (!sharedDraw) {
        alert("Le lien du tirage est invalide ou incomplet.");
        return false;
    }

    currentDraw = sharedDraw;
    finalResults = sharedDraw.results;

    tontineNameInput.value = sharedDraw.drawName || "";
    amountInput.value = sharedDraw.amount || "";

    document.body.classList.add("shared-mode");
    if (sharedBanner) sharedBanner.classList.remove("hidden");

    displayResults(
        sharedDraw.results,
        sharedDraw.drawName || "Tirage OrdreX",
        sharedDraw.id || ""
    );

    return true;
}

/* ============================
   EXPORT PDF
============================ */
pdfButton.addEventListener("click", exportPDF);

function exportPDF() {
    if (finalResults.length === 0) {
        alert("Aucun résultat à exporter.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const drawName = currentDraw?.drawName || tontineNameInput.value.trim() || "Tirage OrdreX";
    const amount = currentDraw?.amount || amountInput.value;
    const drawId = currentDraw?.id || "";

    /* TITRE */
    doc.setFontSize(22);
    doc.text("ORDREX", 105, 20, { align: "center" });

    doc.setFontSize(15);
    doc.text("Résultat du tirage", 105, 30, { align: "center" });

    /* INFORMATIONS */
    doc.setFontSize(11);
    
    let currentY = 45;
    doc.text(`Tirage : ${drawName}`, 14, currentY);
    currentY += 8;
    doc.text(`Participants : ${finalResults.length}`, 14, currentY);
    currentY += 8;
    if (amount) {
        doc.text(`Montant : ${Number(amount).toLocaleString("fr-FR")} ${CURRENCY}`, 14, currentY);
        currentY += 8;
    }
    
    const today = currentDraw?.date
        ? new Date(currentDraw.date).toLocaleDateString("fr-FR")
        : new Date().toLocaleDateString("fr-FR");
        
    doc.text(`Date : ${today}`, 14, currentY);
    currentY += 8;
    if (drawId) {
        doc.text(`ID : ${drawId}`, 14, currentY);
        currentY += 8;
    }
    const tableStartY = currentY + 5;

    /* TABLEAU */
    const tableData = finalResults.map((name, index) => {
        return [String(index + 1).padStart(2, "0"), name];
    });

    doc.autoTable({
        startY: tableStartY,
        head: [["N°", "Participant"]],
        body: tableData,
        theme: "grid",
        styles: { fontSize: 11, cellPadding: 5 },
        headStyles: { fontStyle: "bold" }
    });

    /* FOOTER */
    const finalY = doc.lastAutoTable.finalY + 15;

    doc.setFontSize(9);
    doc.text("Tirage effectué aléatoirement avec OrdreX.", 105, finalY, { align: "center" });

    /* NOM DU FICHIER */
    const safeName = drawName.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    doc.save(`ordreX_${safeName}.pdf`);
}

/* ============================
   REINITIALISATION
============================ */
function resetAll() {
    const confirmation = confirm("Voulez-vous vraiment recommencer ? Le résultat actuel sera perdu.");
    if (!confirmation) return;

    finalResults = [];
    currentDraw = null;
    resultTable.innerHTML = "";
    resultSection.classList.add("hidden");
    animationBox.classList.add("hidden");
    drawButton.disabled = false;

    tontineNameInput.value = "";
    amountInput.value = "";
    participantsInput.value = "";
    participantCount.textContent = "0";

    document.body.classList.remove("shared-mode");
    if (sharedBanner) sharedBanner.classList.add("hidden");

    /* Supprimer la sauvegarde locale */
    localStorage.removeItem(STORAGE_KEY);

    /* Nettoyer l'URL */
    if (window.location.hash || window.location.search) {
        history.replaceState(null, "", window.location.pathname);
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
}

newDrawButton.addEventListener("click", resetAll);

if (closeSharedButton) {
    closeSharedButton.addEventListener("click", resetAll);
}

/* ============================
   INITIALISATION
============================ */
updateParticipantCount();

const sharedResultLoaded = loadSharedResult();

if (!sharedResultLoaded) {
    loadLastDraw();
}

function handleUrlChange() {
    const loaded = loadSharedResult();
    if (!loaded) {
        document.body.classList.remove("shared-mode");
        if (sharedBanner) sharedBanner.classList.add("hidden");
    }
}

window.addEventListener("hashchange", handleUrlChange);
window.addEventListener("popstate", handleUrlChange);