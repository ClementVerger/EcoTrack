# Conventions de nommage – Projet EcoTrack

## 🎯 Objectif
Ce document définit les conventions de nommage à appliquer sur l’ensemble du projet **EcoTrack** afin de garantir :
- une meilleure lisibilité du code
- une cohérence globale
- un travail collaboratif efficace
- une maintenance facilitée

Ces règles sont obligatoires pour tous les contributeurs du projet.

---

## 📁 Conventions de nommage des dossiers

- Format : **kebab-case**
- Pas d’espaces
- Pas de majuscules
- Noms explicites et fonctionnels

✅ Exemples :
```yaml
backend/
frontend/
docs/
user-service/
auth-middleware/
```

❌ À éviter :
```yaml
UserService/
auth_Middleware/
dossier test/
```
---

## 📄 Conventions de nommage des fichiers

- Format : **kebab-case.ext**
- Nom descriptif du rôle du fichier

✅ Exemples :
```yaml
user.controller.js
auth.middleware.js
database.config.js
error-handler.js
```
---

## 🧠 Variables et fonctions (JavaScript / Node.js)

- Format : **camelCase**
- Noms explicites
- Verbes pour les fonctions

✅ Exemples :
```js
let userEmail;
const totalDistance;

function calculateCarbonFootprint() {}
function getUserById() {}
```

---

## 🧩 Classes (JavaScript / React)
- Format : **PascalCase**
- Nom au singulier

✅ Exemples :

```js
class UserService {}
class AuthController {}
class CarbonCalculator {}
```

## ⚛️ Composants React
 - Format : **PascalCase**
 - Un composant = un fichier

✅ Exemples :
```
UserProfile.jsx
LoginForm.jsx
DashboardPage.jsx
```
---

## 🧪 Tests
 - Format : **nom-du-fichier.test.js**
 - Placés dans un dossier `tests/` ou `__tests__/`

✅ Exemples :
```pgsql
user.service.test.js
auth.controller.test.js
```
---
## 🌐 Routes API REST
 - Format : **kebab-case**
 - Pluriel pour les ressources
 - Versionnées

✅ Exemples :

```bash
Copier le code
GET    /api/v1/users
POST   /api/v1/auth/login
GET    /api/v1/activities
```
---

## 🗄️ Base de données (PostgreSQL / MongoDB)
**Tables / Collections**
 - Format : **snake_case**
 - Pluriel

```bash
users
carbon_activities
transport_logs
```

**Colonnes / Champs**
 - Format : **snake_case**

```bash
id
created_at
updated_at
user_id
carbon_value
```

**Clés étrangères**
 - Format : **id_entite**

```nginx
Copier le code
id_user
id_activity
```

## 🔐 Variables d’environnement
 - Format : SCREAMING_SNAKE_CASE
 - Pas de valeurs sensibles dans le dépôt

✅ Exemples :
```ini
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_NAME=ecotrack
JWT_SECRET=ecotrack
```

## 🐳 Docker & DevOps
**Images / Services Docker**
 - Format : **kebab-case**

```
ecotrack-backend
ecotrack-frontend
postgres-db
```

**Conteneurs**
```
ecotrack-backend-dev
ecotrack-postgres
```

## 🌱 Git & branches
**Branches**
 - Format :
```php-template
main
develop
feature/<epic>-<description>
fix/<ticket>-<description>
```

✅ Exemples :

```bash
feature/scrum-31-backend-init
fix/scrum-45-auth-bug
```

## 📝 Commits Git
 - Format : Conventional Commits

```makefile
feat: ajout de l’authentification JWT
fix: correction du calcul carbone
docs: ajout des conventions de nommage
chore: mise à jour des dépendances
```

## ✅ Règle générale
**Un nom doit décrire clairement ce qu’il fait.**
Si un nom nécessite un commentaire pour être compris, il est mal choisi.

## 📌 Document vivant :
Toute évolution des conventions doit être validée par l’équipe et documentée ici.