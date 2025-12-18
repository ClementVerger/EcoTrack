---

# Structure du projet EcoTrack

Ce document décrit l’organisation des dossiers/fichiers du dépôt **EcoTrack** afin que chaque développeur comprenne rapidement *où mettre quoi*, *où chercher*, et *comment le projet est structuré*.

## Vue d’ensemble (racine du repo)

```
ecotrack/
├── README.md
├── CONTRIBUTING.md
├── .gitignore
├── docker-compose.yml
├── docs/
├── backend/
└── frontend/
```

### `README.md`

* Point d’entrée du projet.
* Contient : présentation, prérequis, installation, commandes, lancement (local + Docker), et liens vers la doc.

### `CONTRIBUTING.md`

* Règles de contribution : branches, conventions de commits, PR, organisation Scrum (Epic/Story/Task).
* Sert de guide commun pour éviter les divergences entre élèves.

### `.gitignore`

* Liste tout ce qui ne doit pas être versionné (node_modules, logs, .env, build, etc.).

### `docker-compose.yml`

* Stack de dev locale (ex : backend + frontend + db si ajoutée).
* Objectif : “1 commande pour lancer tout le projet” en environnement Docker.

---

## Dossier `docs/` (documentation projet)

```
docs/
├── vision.md
├── architecture/
│   ├── diagramme-global.png
│   ├── diagramme-sequence.png
│   └── diagramme-deploiement.png
├── backlog/
│   ├── epics.md
│   ├── sprint-1.md
│   └── sprint-2.md
└── conventions/
    ├── nommage.md
    ├── commits.md
    └── branches.md
```

### `docs/vision.md`

* Vision produit : objectifs, utilisateurs, problèmes adressés, périmètre MVP.

### `docs/architecture/`

* Diagrammes et explications techniques.
* **diagramme-global** : composants (front/back/db/api externes…)
* **diagramme-sequence** : exemple de flux (login, création, calcul…)
* **diagramme-deploiement** : vue infra (docker/k8s, réseaux, services)

### `docs/backlog/`

* Traduction “documentée” du Jira : epics + sprints.
* Pratique pour relire le plan sans ouvrir l’outil.

### `docs/conventions/`

* Standards projet :

  * `nommage.md` : fichiers/dossiers, variables, endpoints
  * `commits.md` : convention de commits (ex: Conventional Commits)
  * `branches.md` : stratégie de branches (main + branches élèves + branches par epic)

---

## Dossier `backend/` (API Node/Express)

```
backend/
├── README.md
├── package.json
├── package-lock.json
└── src/
    ├── index.js (ou server.js)
    ├── config/
    ├── routes/
    ├── controllers/
    ├── services/
    ├── middlewares/
    ├── models/
    └── utils/
```

### `backend/README.md`

* Doc spécifique backend : variables d’env, commandes, endpoints, structure interne.

### `backend/package.json`

* Scripts et dépendances (start/dev/lint/format/build).
* Référence unique des versions utilisées.

### `backend/src/`

* Code source “métier” du backend.

**Rôles typiques des sous-dossiers :**

* `config/` : configuration (DB, env, constants, loaders)
* `routes/` : déclaration des routes HTTP (Express Router)
* `controllers/` : logique de traitement des requêtes (req/res), appelle services
* `services/` : logique métier (calculs, traitement, appels externes)
* `middlewares/` : auth, validation, gestion erreurs, logs
* `models/` : schémas/ORM (si Mongo/Mongoose ou Sequelize, etc.)
* `utils/` : helpers réutilisables (format, date, sanitize, etc.)

---

## Dossier `frontend/` (application React)

```
frontend/
├── README.md
├── package.json
├── package-lock.json
├── public/
└── src/
    ├── main.jsx (ou index.jsx)
    ├── App.jsx
    ├── pages/
    ├── components/
    ├── services/
    ├── assets/
    ├── styles/
    └── utils/
```

### `frontend/README.md`

* Doc spécifique front : lancement, build, config API_URL, conventions UI.

### `frontend/public/`

* Fichiers statiques servis tels quels (favicon, index.html, images publiques).

### `frontend/src/`

* Code React.

**Rôles typiques des sous-dossiers :**

* `pages/` : pages/screens (routing)
* `components/` : composants réutilisables (UI)
* `services/` : appels API (fetch/axios), clients, auth
* `assets/` : images, icônes, ressources importées
* `styles/` : CSS global / variables / thèmes
* `utils/` : helpers (format dates, validators, etc.)

---

## Règles simples “où mettre quoi”

* **Doc** → `docs/`
* **API / endpoints** → `backend/src/routes` + `controllers` + `services`
* **UI réutilisable** → `frontend/src/components`
* **Pages** → `frontend/src/pages`
* **Config / env** → `backend/src/config` (+ `.env.example` à la racine ou dans backend selon choix)
* **Conventions projet** → `docs/conventions`

---