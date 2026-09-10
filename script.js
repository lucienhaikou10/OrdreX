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
   PARTAGER LE RESULTAT
============================ */
shareButton.addEventListener("click", shareResult);

async function shareResult() {
    if (!currentDraw || finalResults.length === 0) {
        alert("Aucun résultat à partager.");
        return;
    }

    /* On transforme le résultat en données encodées directement dans l'URL. */
    const shareData = {
        id: currentDraw.id,
        drawName: currentDraw.drawName,
        amount: currentDraw.amount,
        results: currentDraw.results,
        date: currentDraw.date
    };

    const encodedData = encodeData(shareData);
    const shareUrl = `${window.location.origin}${window.location.pathname}#result=${encodedData}`;
    const shareText = `Résultat du tirage "${currentDraw.drawName}" avec OrdreX.`;

    if (shareUrl.length > 2000) {
        alert("Attention : Le lien généré est très long et pourrait ne pas fonctionner sur tous les appareils.");
    }

    /* Partage natif du téléphone */
    if (navigator.share) {
        try {
            await navigator.share({
                title: "Résultat OrdreX",
                text: shareText,
                url: shareUrl
            });
            return;
        } catch (error) {
            if (error.name === "AbortError") return;
        }
    }

    /* Sinon, copie du lien */
    try {
        await navigator.clipboard.writeText(shareUrl);
        alert("Lien du résultat copié !\n\nVous pouvez maintenant le partager.");
    } catch (error) {
        prompt("Copiez ce lien pour partager le résultat :", shareUrl);
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
    try {
        const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
        const padding = "=".repeat((4 - base64.length % 4) % 4);
        const binary = atob(base64 + padding);
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
function loadSharedResult() {
    const hash = window.location.hash;

    if (!hash.startsWith("#result=")) return false;

    const encoded = hash.substring("#result=".length);
    const rawData = decodeData(encoded);
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
    if (window.location.hash) {
        history.replaceState(null, "", window.location.pathname + window.location.search);
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

window.addEventListener("hashchange", () => {
    loadSharedResult();
});