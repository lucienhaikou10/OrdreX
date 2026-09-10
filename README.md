# OrdreX 🎲

> **Attribuez les positions en un clic — Simple, rapide et transparent.**

OrdreX est une application web moderne et responsive permettant d'effectuer un tirage au sort transparent entre plusieurs participants et d'attribuer automatiquement un ordre de passage ou une position à chacun.

Idéal pour les **tontines**, les groupes d'épargne, les équipes de travail, les passages d'examens ou toute activité collective nécessitant un tirage aléatoire équitable et vérifiable.

---

## 🚀 Démonstration en ligne

- **GitHub Pages** : [https://lucienhaikou10.github.io/OrdreX/](https://lucienhaikou10.github.io/OrdreX/)
- **Dépôt GitHub** : [https://github.com/lucienhaikou10/OrdreX](https://github.com/lucienhaikou10/OrdreX)

---

## 🎯 Pourquoi OrdreX ?

Lorsqu'un groupe doit déterminer l'ordre de ses membres (ex : ordre de ramassage d'une tontine), les tirages manuels sur bouts de papier sont longs, fastidieux et souvent sujets à contestation.

**OrdreX résout ce problème en offrant :**
- ⚡ **Simplicité** : Entrez les noms, cliquez, le résultat est instantané.
- 🎲 **Équité absolue** : Algorithme de mélange aléatoire standard **Fisher-Yates** (tirage équiprobable et non biaisé).
- 🔒 **Transparence & Traçabilité** : Chaque tirage dispose d'un identifiant unique (ex: `ORDX-2026-A7K92P`).
- 📱 **Partage WhatsApp instantané** : Envoi du récapitulatif complet et du lien en 1 clic dans vos groupes.
- 🔗 **Lien de vérification en ligne** : Les membres ouvrent le lien et consultent le tableau officiel en mode consultation.
- 📄 **Export PDF professionnel** : Téléchargez une fiche officielle prête à imprimer ou archiver.
- 💾 **Sauvegarde locale automatique** : Aucun risque de perdre le tirage en cas de rafraîchissement accidentel.

---

## 🛠️ Fonctionnalités détaillées

### 1. Saisie intuitive & validations
- **Nom du tirage** : Personnalisez l'intitulé (ex: *Tontine Janvier 2027*).
- **Montant facultatif** : Renseignez le montant de la cotisation avec formatage automatique en devises.
- **Liste des participants** : Un nom par ligne, l'ordre de saisie n'a aucune importance.
- **Compteur temps réel** : Suivi dynamique du nombre de participants inscrits.
- **Détection des doublons** : Blocage automatique si un nom est inscrit plusieurs fois.
- **Limites de sécurité** : Jusqu'à 100 participants et 50 caractères par nom.

### 2. Algorithme de tirage Fisher-Yates
Le mélange est effectué selon l'algorithme reconnu de **Fisher-Yates**, garantissant que chaque permutation possible a strictement la même probabilité d'apparaître. Une animation visuelle de quelques secondes accompagne le mélange.

### 3. Résultat clair & numéroté
Chaque membre reçoit un numéro d'ordre officiel :

| N° | Participant |
|:---:|:---|
| **01** | Marie |
| **02** | David |
| **03** | Ibrahim |
| **04** | Aïcha |
| **05** | Paul |
| **06** | Koffi |

### 4. Partage multicanal & WhatsApp
- **Bouton « Partager sur WhatsApp »** : Rédige automatiquement un message propre et lisible pour vos groupes WhatsApp :
  ```text
  🎲 OrdreX — Résultat du tirage
  📋 Tontine Janvier 2027
  💰 Montant : 50 000 FCFA
  🆔 ID : ORDX-2026-A7K92P

  Ordre de passage :
  01. Marie
  02. David
  03. Ibrahim
  ...

  🔗 Consulter ou exporter en PDF :
  https://...#result=...
  ```
- **Bouton « Copier / Partager »** : Partage natif sur mobile (`Web Share API`) ou copie sécurisée dans le presse-papier avec notification toast.

### 5. Mode consultation partagée
Lorsqu'un membre ouvre un lien partagé :
- Une bannière bleue indique qu'il s'agit d'un **résultat partagé officiel**.
- Les formulaires de modification sont masqués pour éviter toute altération.
- Le destinataire peut consulter les résultats, télécharger le PDF ou démarrer un nouveau tirage.

### 6. Export PDF officiel
Le document généré avec **jsPDF** et **jsPDF-AutoTable** comprend :
- Le titre et l'en-tête officiel OrdreX ;
- Le nom du tirage, la date et l'ID unique ;
- Le montant de l'opération (le cas échéant) ;
- Le tableau complet avec mise en page grille ;
- Nom de fichier normalisé (ex: `ordreX_tontine_janvier_2027.pdf`).

### 7. Sauvegarde locale (LocalStorage)
Le dernier tirage reste conservé dans le navigateur sans nécessiter de serveur ni de compte utilisateur.

---

## 📱 Responsive & Mobile-First

OrdreX est optimisé pour tous les formats :
- 📱 **Smartphones** (iOS & Android) — boutons pleine largeur, taille de police anti-zoom sur iPhone.
- 💻 **Tablettes & Ordinateurs** — disposition aérée et centrée.

---

## 🧰 Technologies utilisées

- **HTML5** (Structure sémantique, labels accessibles, balises SEO & Open Graph)
- **CSS3** (Flexbox, variables, animations fluides, media queries responsive)
- **JavaScript Vanilla** (ES6+, zéro dépendance lourde)
- **Local Storage** (Persistance locale côté client)
- **jsPDF & jsPDF-AutoTable** (Génération de documents PDF avec intégrité SRI)

---

## 📁 Structure du projet

```text
OrdreX/
│
├── index.html     # Structure HTML accessible, SEO et conteneurs
├── style.css      # Design moderne, responsive et composants (toast, bannière)
├── script.js     # Logique métier, Fisher-Yates, sanitisation, partage & PDF
└── README.md      # Documentation du projet
```

---

## 💻 Installation locale

Aucun outil de build (Node/Webpack) n'est nécessaire. Clonez et ouvrez simplement dans votre navigateur :

```bash
git clone https://github.com/lucienhaikou10/OrdreX.git
cd OrdreX
```

Puis double-cliquez sur `index.html`.

---

## 👤 Auteur

Conçu et développé par **Lucien HAIKOU**  
- 💼 **LinkedIn** : [linkedin.com/in/lucienhaikou10](https://www.linkedin.com/in/lucienhaikou10)
- 🐙 **GitHub** : [@lucienhaikou10](https://github.com/lucienhaikou10)

---

## 📄 Licence

Ce projet est sous licence libre. Vous êtes libre de l'utiliser pour vos tontines, groupes associatifs ou projets personnels.