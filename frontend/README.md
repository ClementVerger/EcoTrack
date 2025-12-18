# Frontend

Prérequis
-------

- Node (version LTS recommandée)

Installation
------------

```bash
npm i
```

Lancement (dev)
----------------

```bash
npm run dev
```

Build
-----

```bash
npm run build
```

Variables d'environnement
------------------------

Copiez l'exemple d'env en local :

Sur macOS / Linux :
```bash
cp .env.example .env
```

Sur PowerShell / Windows :
```powershell
Copy-Item .env.example .env
```

Le fichier `.env.example` contient des valeurs d'exemple :

```
# URL de l'API (ex: http://localhost:3000)
VITE_API_BASE_URL=http://localhost:3000

# Timeout axios en ms
VITE_API_TIMEOUT=5000
```

Ne commitez pas votre fichier `.env` local. Ajoutez-le à `.gitignore` si nécessaire :

```
# Ignore local env files
.env
.env.local
```

