const CURRENCY = "FCFA";
const MAX_PARTICIPANTS = 100;
const MAX_NAME_LENGTH = 50;
const STORAGE_KEY = "ordrex_last_draw";

/* ÉLÉMENTS DU DOM */
const stepSetup = document.getElementById("stepSetup");
const stepDrawing = document.getElementById("stepDrawing");
const stepResult = document.getElementById("stepResult");

const tontineNameInput = document.getElementById("tontineName");
const amountInput = document.getElementById("amount");
const participantsInput = document.getElementById("participants");
const participantCount = document.getElementById("participantCount");
const participantMinNote = document.getElementById("participantMinNote");

const clearParticipantsButton = document.getElementById("clearParticipantsButton");
const duplicateAlert = document.getElementById("duplicateAlert");
const duplicateMessage = document.getElementById("duplicateMessage");
const fixDuplicatesButton = document.getElementById("fixDuplicatesButton");

const drawButton = document.getElementById("drawButton");
const drawAnimationTitle = document.getElementById("drawAnimationTitle");
const rollingParticipant = document.getElementById("rollingParticipant");
const drawProgressFill = document.getElementById("drawProgressFill");

const sharedBanner = document.getElementById("sharedBanner");
const closeSharedButton = document.getElementById("closeSharedButton");

const resultInfo = document.getElementById("resultInfo");
const drawIdDisplay = document.getElementById("drawIdDisplay");
const resultTable = document.getElementById("resultTable");

const pdfButton = document.getElementById("pdfButton");
const shareButton = document.getElementById("shareButton");
const newDrawButton = document.getElementById("newDrawButton");

const shareModal = document.getElementById("shareModal");
const closeShareModal = document.getElementById("closeShareModal");
const modalWhatsappBtn = document.getElementById("modalWhatsappBtn");
const modalFacebookBtn = document.getElementById("modalFacebookBtn");
const modalLinkedinBtn = document.getElementById("modalLinkedinBtn");
const modalNativeShareBtn = document.getElementById("modalNativeShareBtn");
const shareUrlInput = document.getElementById("shareUrlInput");
const modalCopyBtn = document.getElementById("modalCopyBtn");

let finalResults = [];
let currentDraw = null;
let animationInterval = null;

/* ============================
   GESTION DES ÉTAPES DU WORKFLOW
============================ */
function showStep(stepName) {
    stepSetup.classList.add("hidden");
    stepDrawing.classList.add("hidden");
    stepResult.classList.add("hidden");

    if (stepName === "setup") {
        stepSetup.classList.remove("hidden");
    } else if (stepName === "drawing") {
        stepDrawing.classList.remove("hidden");
    } else if (stepName === "result") {
        stepResult.classList.remove("hidden");
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ============================
   PARSING ET GESTION DES PARTICIPANTS
============================ */
function cleanParticipantName(rawName) {
    if (!rawName) return "";
    // Supprime la numérotation initiale éventuelle (ex: "1.", "01 -", "1)", "#1")
    let cleaned = rawName.trim().replace(/^([0-9]{1,3}\s*[\.\-\)]\s*|#\s*[0-9]{1,3}\s*)/, "").trim();
    return cleaned.substring(0, MAX_NAME_LENGTH);
}

function getParticipants() {
    const rawText = participantsInput.value;
    if (!rawText || !rawText.trim()) return [];

    // Découpage intelligent par ligne, virgule ou point-virgule
    return rawText
        .split(/[\n,;]+/)
        .map(cleanParticipantName)
        .filter(name => name.length > 0);
}

function findDuplicateGroups(names) {
    const counts = new Map();
    names.forEach(name => {
        const key = name.toLowerCase();
        counts.set(key, (counts.get(key) || 0) + 1);
    });

    const duplicates = [];
    counts.forEach((count, key) => {
        if (count > 1) {
            const originalName = names.find(n => n.toLowerCase() === key) || key;
            duplicates.push({ name: originalName, count });
        }
    });

    return duplicates;
}

function updateParticipantCount() {
    const participants = getParticipants();
    participantCount.textContent = participants.length;

    if (participants.length < 2) {
        participantMinNote.textContent = "Minimum 2 requis";
        participantMinNote.style.color = "#dc2626";
    } else {
        participantMinNote.textContent = "Prêt pour le tirage";
        participantMinNote.style.color = "#16a34a";
    }

    // Détection des doublons
    const duplicates = findDuplicateGroups(participants);
    if (duplicates.length > 0) {
        const dupList = duplicates.map(d => `<strong>${escapeHtml(d.name)}</strong> (${d.count} fois)`).join(", ");
        duplicateMessage.innerHTML = `Attention : Certains participants sont inscrits plusieurs fois : ${dupList}. Dans une tontine, vous pouvez les différencier automatiquement.`;
        duplicateAlert.classList.remove("hidden");
    } else {
        duplicateAlert.classList.add("hidden");
    }
}

participantsInput.addEventListener("input", updateParticipantCount);

// Effacer la liste
clearParticipantsButton.addEventListener("click", () => {
    if (participantsInput.value.trim() && !confirm("Effacer toute la liste des participants ?")) return;
    participantsInput.value = "";
    updateParticipantCount();
});

// Différencier automatiquement les doublons (ex: Paul (1), Paul (2))
fixDuplicatesButton.addEventListener("click", () => {
    const participants = getParticipants();
    const seenCount = new Map();
    const totals = new Map();

    participants.forEach(name => {
        const key = name.toLowerCase();
        totals.set(key, (totals.get(key) || 0) + 1);
    });

    const fixed = participants.map(name => {
        const key = name.toLowerCase();
        if (totals.get(key) > 1) {
            const cur = (seenCount.get(key) || 0) + 1;
            seenCount.set(key, cur);
            return `${name} (${cur})`;
        }
        return name;
    });

    participantsInput.value = fixed.join("\n");
    updateParticipantCount();
    showToast("Noms en double différenciés avec succès !");
});

/* ============================
   GÉNÉRER UN ID UNIQUE
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
   MÉLANGE ALÉATOIRE AVEC GARANTIE
   Fisher-Yates garanti
============================ */
function shuffleArray(array) {
    if (array.length <= 1) return [...array];

    let shuffled = [...array];
    let attempts = 0;

    // Fisher-Yates standard
    const doFisherYates = (arr) => {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    };

    // On s'assure qu'au tirage, si N >= 2, l'ordre n'est pas identique à l'ordre initial
    do {
        shuffled = doFisherYates(array);
        attempts++;
        const isExactSameOrder = shuffled.every((val, idx) => val === array[idx]);
        if (!isExactSameOrder) break;
    } while (attempts < 5);

    // Si après 5 tentatives c'est toujours le même ordre (statistiquement rare), on permute les 2 premiers
    if (shuffled.every((val, idx) => val === array[idx])) {
        [shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]];
    }

    return shuffled;
}

/* ============================
   LANCER LE TIRAGE
============================ */
drawButton.addEventListener("click", startDraw);

function startDraw() {
    const participants = getParticipants();

    if (participants.length < 2) {
        alert("Veuillez entrer au moins 2 participants pour effectuer un tirage.");
        participantsInput.focus();
        return;
    }

    if (participants.length > MAX_PARTICIPANTS) {
        alert(`Le nombre maximum de participants est de ${MAX_PARTICIPANTS}. Vous en avez ${participants.length}.`);
        return;
    }

    // Gestion des doublons stricts si l'utilisateur n'a pas cliqué sur différencier
    const duplicates = findDuplicateGroups(participants);
    if (duplicates.length > 0) {
        const confirmDraw = confirm(
            `Attention : Certains participants sont inscrits plusieurs fois (${duplicates.map(d => d.name).join(", ")}).\n\nVoulez-vous continuer le tirage avec ces doublons ?`
        );
        if (!confirmDraw) return;
    }

    const drawName = tontineNameInput.value.trim() || "Tirage OrdreX";
    const amount = amountInput.value.trim();

    // 1. Passage à l'étape d'animation
    showStep("drawing");
    drawAnimationTitle.textContent = `Tirage : ${drawName}`;

    // Réinitialisation barre de progression
    drawProgressFill.style.transition = "none";
    drawProgressFill.style.width = "0%";
    void drawProgressFill.offsetWidth; // force reflow
    drawProgressFill.style.transition = "width 2.4s cubic-bezier(0.1, 0.8, 0.2, 1)";
    drawProgressFill.style.width = "100%";

    // 2. Animation dynamique du défilement des noms (Effet Roulette)
    let rollIndex = 0;
    const pool = [...participants];
    animationInterval = setInterval(() => {
        const randomIndex = Math.floor(Math.random() * pool.length);
        rollingParticipant.textContent = pool[randomIndex];
        rollIndex++;
    }, 75);

    // 3. Révélation après 2,5 secondes
    setTimeout(() => {
        clearInterval(animationInterval);

        finalResults = shuffleArray(participants);

        currentDraw = {
            id: generateDrawId(),
            drawName: drawName,
            amount: amount || "",
            participants: participants,
            results: finalResults,
            date: new Date().toISOString()
        };

        saveDraw();
        displayResults(currentDraw);
        showStep("result");
    }, 2500);
}

/* ============================
   AFFICHER LES RESULTATS
============================ */
function displayResults(draw) {
    if (!draw || !Array.isArray(draw.results)) return;

    const results = draw.results;
    const drawName = draw.drawName || "Tirage OrdreX";
    const drawId = draw.id || "";
    const amount = draw.amount;

    // Titre et informations
    let info = `${drawName} • ${results.length} participant(s)`;
    if (amount) {
        const cleanAmount = Number(String(amount).replace(/\s/g, ""));
        if (!isNaN(cleanAmount) && cleanAmount > 0) {
            info += ` • ${cleanAmount.toLocaleString("fr-FR")} ${CURRENCY}`;
        } else {
            info += ` • ${amount} ${CURRENCY}`;
        }
    }
    resultInfo.textContent = info;

    if (drawId) {
        drawIdDisplay.textContent = `ID officiel : ${drawId}`;
    }

    // Construction du Tableau complet
    resultTable.innerHTML = "";
    results.forEach((name, index) => {
        const row = document.createElement("tr");

        const rankTd = document.createElement("td");
        rankTd.className = "col-rank";

        const pill = document.createElement("span");
        pill.className = `rank-pill ${index < 3 ? `rank-pill-${index + 1}` : ""}`;
        pill.textContent = String(index + 1).padStart(2, "0");
        rankTd.appendChild(pill);

        const nameTd = document.createElement("td");
        nameTd.textContent = name;
        if (index === 0) nameTd.style.fontWeight = "700";

        row.appendChild(rankTd);
        row.appendChild(nameTd);
        resultTable.appendChild(row);
    });
}

function escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

newDrawButton.addEventListener("click", resetAll);

if (closeSharedButton) {
    closeSharedButton.addEventListener("click", resetAll);
}

function resetAll() {
    if (currentDraw && !confirm("Voulez-vous vraiment commencer un nouveau tirage ? Le résultat actuel sera archivé.")) {
        return;
    }

    finalResults = [];
    currentDraw = null;
    resultTable.innerHTML = "";

    tontineNameInput.value = "";
    amountInput.value = "";
    participantsInput.value = "";
    updateParticipantCount();

    document.body.classList.remove("shared-mode");
    if (sharedBanner) sharedBanner.classList.add("hidden");
    if (shareModal) hideShareModal();

    localStorage.removeItem(STORAGE_KEY);

    // Nettoyer l'URL
    if (window.location.search || window.location.hash) {
        try {
            history.replaceState(null, "", window.location.pathname);
        } catch (e) {
            console.warn("URL cleanup", e);
        }
    }

    showStep("setup");
}

/* ============================
   SAUVEGARDE ET RESTAURATION LOCALE
============================ */
function saveDraw() {
    if (!currentDraw) return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(currentDraw));
    } catch (error) {
        console.error("Sauvegarde locale impossible :", error);
    }
}

function loadLastDraw() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return false;

        const rawData = JSON.parse(saved);
        const draw = sanitizeSharedData(rawData);
        if (!draw) return false;

        currentDraw = draw;
        finalResults = draw.results;

        // On restaure les champs dans le formulaire pour ne rien perdre
        tontineNameInput.value = draw.drawName || "";
        amountInput.value = draw.amount || "";
        if (draw.participants && draw.participants.length > 0) {
            participantsInput.value = draw.participants.join("\n");
        } else {
            participantsInput.value = draw.results.join("\n");
        }
        updateParticipantCount();

        // Afficher directement le résultat tout en permettant de modifier la liste
        displayResults(draw);
        showStep("result");
        return true;
    } catch (e) {
        console.error("Erreur chargement tirage :", e);
        return false;
    }
}

/* ============================
   SANITIZATION ROBUSTE
============================ */
function sanitizeSharedData(data) {
    if (!data || typeof data !== "object") return null;
    if (!Array.isArray(data.results) || data.results.length === 0) return null;
    if (data.results.length > MAX_PARTICIPANTS) return null;

    const cleanResults = data.results
        .filter(name => typeof name === "string")
        .map(name => cleanParticipantName(name))
        .filter(name => name.length > 0);

    if (cleanResults.length === 0) return null;

    let cleanParticipants = [];
    if (Array.isArray(data.participants)) {
        cleanParticipants = data.participants
            .filter(name => typeof name === "string")
            .map(name => cleanParticipantName(name))
            .filter(name => name.length > 0);
    }
    if (cleanParticipants.length === 0) {
        cleanParticipants = [...cleanResults];
    }

    return {
        id: typeof data.id === "string" ? data.id.substring(0, 25) : generateDrawId(),
        drawName: typeof data.drawName === "string" ? data.drawName.substring(0, 50) : "Tirage OrdreX",
        amount: typeof data.amount === "string" || typeof data.amount === "number" ? String(data.amount).substring(0, 20) : "",
        participants: cleanParticipants,
        results: cleanResults,
        date: typeof data.date === "string" ? data.date.substring(0, 30) : new Date().toISOString()
    };
}

/* ============================
   ENCODAGE & PARTAGE DES LIENS
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

function decodeData(encoded) {
    if (!encoded || typeof encoded !== "string") return null;
    try {
        let clean = encoded.trim().replace(/\s+/g, "");
        const base64 = clean.replace(/-/g, "+").replace(/_/g, "/");
        const padLength = (4 - (base64.length % 4)) % 4;
        if (padLength === 3) return null;
        const binary = atob(base64 + "=".repeat(padLength));
        const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
        const json = new TextDecoder().decode(bytes);
        return JSON.parse(json);
    } catch (e) {
        console.error("Décodage token impossible :", e);
        return null;
    }
}

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
    const token = encodeData(shareData);
    // Utiliser ?result= pour compatibilité absolue avec WhatsApp et redirections, avec #result en fallback
    return `${getBaseUrl()}?result=${token}`;
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

    return `*OrdreX — Résultat officiel du tirage*\n` +
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
            console.warn("Clipboard API:", e);
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
        const ok = document.execCommand("copy");
        document.body.removeChild(textArea);
        if (ok) return true;
    } catch (e) {
        console.warn("execCommand:", e);
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
   GESTION DU PARTAGE ET DE LA MODAL
============================ */
function openShareModal() {
    if (!currentDraw || finalResults.length === 0) {
        alert("Aucun résultat à partager.");
        return;
    }

    const shareUrl = buildShareUrl();
    shareUrlInput.value = shareUrl;

    // Afficher l'option de partage natif si sur mobile supporté
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (navigator.share && isMobile) {
        modalNativeShareBtn.classList.remove("hidden");
    } else {
        modalNativeShareBtn.classList.add("hidden");
    }

    shareModal.classList.remove("hidden");
}

function hideShareModal() {
    shareModal.classList.add("hidden");
}

shareButton.addEventListener("click", openShareModal);
closeShareModal.addEventListener("click", hideShareModal);

shareModal.addEventListener("click", (e) => {
    if (e.target === shareModal) {
        hideShareModal();
    }
});

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !shareModal.classList.contains("hidden")) {
        hideShareModal();
    }
});

// Partager sur WhatsApp
modalWhatsappBtn.addEventListener("click", () => {
    if (!currentDraw) return;
    if (window.location.protocol === "file:") {
        alert("Note : Vous utilisez un fichier local (file://). Pour que les membres de votre groupe puissent ouvrir ce lien, publiez le site sur Internet (ex: Vercel).");
    }
    const shareUrl = buildShareUrl();
    const message = buildShareMessage(currentDraw, shareUrl);
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
});

// Partager sur Facebook
modalFacebookBtn.addEventListener("click", () => {
    if (!currentDraw) return;
    const shareUrl = buildShareUrl();
    if (window.location.protocol === "file:") {
        alert("Note : Vous êtes en local (file://). Pour partager sur Facebook, le site doit être hébergé en ligne (ex: Vercel).");
    }
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(fbUrl, "_blank", "noopener,noreferrer,width=620,height=550");
});

// Partager sur LinkedIn
modalLinkedinBtn.addEventListener("click", () => {
    if (!currentDraw) return;
    const shareUrl = buildShareUrl();
    if (window.location.protocol === "file:") {
        alert("Note : Vous êtes en local (file://). Pour partager sur LinkedIn, le site doit être accessible en ligne (ex: Vercel).");
    }
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    window.open(linkedinUrl, "_blank", "noopener,noreferrer,width=620,height=550");
});

// Partager sur d'autres applications (Web Share API)
modalNativeShareBtn.addEventListener("click", async () => {
    if (!currentDraw) return;
    const shareUrl = buildShareUrl();
    const message = buildShareMessage(currentDraw, shareUrl);
    try {
        await navigator.share({
            title: `Résultat OrdreX — ${currentDraw.drawName}`,
            text: message,
            url: shareUrl
        });
        hideShareModal();
    } catch (err) {
        if (err.name !== "AbortError") {
            console.warn("Share error:", err);
        }
    }
});

// Copier le lien depuis la modal
modalCopyBtn.addEventListener("click", async () => {
    const shareUrl = shareUrlInput.value || buildShareUrl();
    const copied = await copyToClipboard(shareUrl);
    if (copied) {
        shareUrlInput.select();
        showToast("Lien copié dans le presse-papier !");
    } else {
        prompt("Copiez ce lien :", shareUrl);
    }

    if (window.location.protocol === "file:") {
        setTimeout(() => {
            alert("Note : Vous êtes en local. Pour un partage accessible à tous, déployez sur Vercel.");
        }, 500);
    }
});

/* ============================
   EXPORT PDF SECURISÉ
============================ */
pdfButton.addEventListener("click", exportPDF);

function exportPDF() {
    if (!currentDraw || finalResults.length === 0) {
        alert("Aucun résultat à exporter.");
        return;
    }

    if (!window.jspdf || !window.jspdf.jsPDF) {
        alert("La bibliothèque de génération PDF est en cours de chargement ou indisponible hors-ligne. Veuillez réessayer dans quelques secondes.");
        return;
    }

    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        const drawName = currentDraw.drawName || "Tirage OrdreX";
        const amount = currentDraw.amount;
        const drawId = currentDraw.id || "";

        /* EN-TETE */
        doc.setFontSize(22);
        doc.text("ORDREX", 105, 20, { align: "center" });

        doc.setFontSize(14);
        doc.text("Résultat officiel du tirage", 105, 29, { align: "center" });

        /* DETAILS DU TIRAGE */
        doc.setFontSize(10.5);
        let currentY = 44;

        doc.text(`Tirage : ${drawName}`, 14, currentY);
        currentY += 7;

        doc.text(`Participants : ${finalResults.length}`, 14, currentY);
        currentY += 7;

        if (amount) {
            const cleanAmount = Number(String(amount).replace(/\s/g, ""));
            const amtStr = !isNaN(cleanAmount) && cleanAmount > 0 ? cleanAmount.toLocaleString("fr-FR") : amount;
            doc.text(`Montant : ${amtStr} ${CURRENCY}`, 14, currentY);
            currentY += 7;
        }

        const drawDate = currentDraw.date ? new Date(currentDraw.date).toLocaleDateString("fr-FR") : new Date().toLocaleDateString("fr-FR");
        doc.text(`Date : ${drawDate}`, 14, currentY);
        currentY += 7;

        if (drawId) {
            doc.text(`Identifiant : ${drawId}`, 14, currentY);
            currentY += 7;
        }

        /* TABLEAU */
        const tableStartY = currentY + 4;
        const tableData = finalResults.map((name, index) => [
            String(index + 1).padStart(2, "0"),
            name
        ]);

        doc.autoTable({
            startY: tableStartY,
            head: [["Position", "Participant"]],
            body: tableData,
            theme: "grid",
            styles: { fontSize: 10.5, cellPadding: 5 },
            headStyles: { fillColor: [17, 24, 39], textColor: [255, 255, 255], fontStyle: "bold" },
            columnStyles: {
                0: { cellWidth: 30, halign: "center", fontStyle: "bold" }
            }
        });

        /* PIED DE PAGE */
        const finalY = (doc.lastAutoTable ? doc.lastAutoTable.finalY : 200) + 14;
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text("Tirage au sort certifié et transparent effectué avec OrdreX.", 105, finalY, { align: "center" });

        const safeName = drawName.replace(/[^a-z0-9]/gi, "_").toLowerCase();
        doc.save(`ordreX_${safeName}.pdf`);
        showToast("PDF généré et téléchargé !");
    } catch (err) {
        console.error("Erreur génération PDF :", err);
        alert("Une erreur est survenue lors de la création du document PDF : " + err.message);
    }
}

/* ============================
   EXTRACTION DU LIEN PARTAGÉ
============================ */
function getSharedToken() {
    // 1. Paramètre de requête ?result= (privilégié car résiste aux redirections HTTP)
    if (window.location.search) {
        const urlParams = new URLSearchParams(window.location.search);
        const res = urlParams.get("result");
        if (res) return decodeURIComponent(res).trim();
    }

    // 2. Hash fragment #result=
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

    // 3. Fallback regex
    const match = window.location.href.match(/[?&#]result=([^&#\s]+)/);
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
        alert("Le lien du tirage partagé est invalide ou expiré.");
        return false;
    }

    currentDraw = sharedDraw;
    finalResults = sharedDraw.results;

    document.body.classList.add("shared-mode");
    if (sharedBanner) sharedBanner.classList.remove("hidden");

    displayResults(sharedDraw);
    showStep("result");
    return true;
}

/* ============================
   INITIALISATION AU CHARGEMENT
============================ */
updateParticipantCount();

const isShared = loadSharedResult();
if (!isShared) {
    const hasLast = loadLastDraw();
    if (!hasLast) {
        showStep("setup");
    }
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