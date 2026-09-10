# OrdreX

### Attribuez les positions en un clic.

OrdreX est une application web simple permettant d'effectuer un tirage aléatoire entre plusieurs participants et d'attribuer automatiquement une position à chacun.

L'objectif est de rendre les tirages de tontines, groupes ou activités collectives plus simples, rapides et transparents.

---

## 🎯 Pourquoi OrdreX ?

Lorsqu'un groupe doit déterminer aléatoirement l'ordre ou la position de ses membres, le tirage manuel peut être long et parfois contesté.

OrdreX permet de :

- saisir les participants ;
- lancer un seul tirage ;
- mélanger automatiquement les participants ;
- attribuer une position à chaque participant ;
- conserver le dernier résultat ;
- partager le résultat avec un simple lien ;
- exporter le résultat en PDF.

---

## 🚀 Fonctionnement

### 1. Informations du tirage

L'utilisateur peut renseigner :

- le nom du tirage ;
- le montant de la tontine ou de l'opération, de manière facultative.

### 2. Ajouter les participants

Les participants sont saisis un par ligne.

Exemple :

David  
Koffi  
Aïcha  
Paul  
Marie  
Ibrahim

L'ordre dans lequel les noms sont saisis n'a aucune importance.

### 3. Lancer le tirage

Un clic sur le bouton :

**LANCER LE TIRAGE**

déclenche une courte animation avant l'affichage du résultat.

OrdreX utilise un mélange aléatoire basé sur l'algorithme Fisher-Yates.

### 4. Résultat

Chaque participant reçoit automatiquement une position :

| N° | Participant |
|----|-------------|
| 01 | Marie       |
| 02 | David       |
| 03 | Ibrahim     |
| 04 | Aïcha       |
| 05 | Paul        |
| 06 | Koffi       |

Le résultat est généré immédiatement pour l'ensemble des participants.

---

## 🔒 Détection des doublons

OrdreX vérifie automatiquement si un même participant apparaît plusieurs fois.

Exemple :

David  
Koffi  
David

Le tirage est bloqué et l'utilisateur est averti.

---

## 💾 Sauvegarde locale

Le dernier tirage est automatiquement enregistré dans le navigateur grâce au **Local Storage**.

Ainsi, si l'utilisateur actualise accidentellement la page, son dernier résultat peut être récupéré.

Aucune base de données n'est nécessaire pour cette fonctionnalité.

---

## 🔗 Partage du résultat

OrdreX permet de partager un résultat à l'aide d'un lien.

Les informations essentielles du tirage sont encodées directement dans le lien.

Le destinataire peut donc ouvrir le lien et consulter le résultat sans avoir accès au navigateur qui a effectué le tirage.

Le partage peut utiliser le système de partage du téléphone lorsqu'il est disponible ou copier automatiquement le lien.

### Important

Cette fonctionnalité ne constitue pas encore un système d'archivage en ligne.

La V1 fonctionne sans serveur ni base de données.

---

## 📄 Export PDF

Le résultat peut être exporté au format PDF.

Le document contient notamment :

- le nom du tirage ;
- le nombre de participants ;
- le montant lorsqu'il est renseigné ;
- la date ;
- l'identifiant du tirage ;
- la liste des participants et leurs positions.

Exemple de nom de fichier :

`ordreX_tontine_janvier_2027.pdf`

---

## 🆔 Identifiant du tirage

Chaque tirage reçoit automatiquement un identifiant unique.

Exemple :

`ORDX-2026-A7K92P`

Cet identifiant permet d'identifier facilement un tirage particulier.

---

## 📱 Responsive Design

OrdreX est conçu pour fonctionner sur :

- ordinateur ;
- tablette ;
- smartphone.

L'interface s'adapte automatiquement à la taille de l'écran.

---

## 🛠️ Technologies utilisées

OrdreX est actuellement développé avec :

- HTML5
- CSS3
- JavaScript
- Local Storage
- jsPDF
- jsPDF-AutoTable

Aucune base de données n'est nécessaire pour la V1.

---

## 📁 Structure du projet

```text
OrdreX/
│
├── index.html
├── style.css
└── script.js