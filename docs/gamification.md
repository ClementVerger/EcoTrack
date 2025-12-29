# Documentation Technique - Système de Gamification

Ce document détaille l'implémentation complète du système de gamification d'EcoTrack : attribution, stockage et affichage des points.

---

## 📚 Table des matières

1. [Architecture Générale](#architecture-générale)
2. [Stockage des Points](#stockage-des-points)
3. [Attribution des Points](#attribution-des-points)
4. [Affichage des Points](#affichage-des-points)
5. [Flux Complet](#flux-complet)
6. [API Endpoints](#api-endpoints)
7. [Tests](#tests)

---

## 🏗️ Architecture Générale

```
┌─────────────────────────────────────────────────────────────────────┐
│                           FRONTEND                                  │
├─────────────────────────────────────────────────────────────────────┤
│  AuthContext          │  NotificationContext  │  Navbar             │
│  - user.points        │  - notify.points()    │  - Affichage pts    │
│  - user.level         │  - notify.badge()     │  - Affichage niveau │
│  - refreshUser()      │  - notify.levelUp()   │                     │
└───────────────────────┴───────────────────────┴─────────────────────┘
                                    │
                              API REST
                                    │
┌─────────────────────────────────────────────────────────────────────┐
│                           BACKEND                                    │
├─────────────────────────────────────────────────────────────────────┤
│  Controllers          │  Services             │  Models              │
│  - auth.controller    │  - point.service      │  - User (points)     │
│  - report.controller  │  - reward.service     │  - PointHistory      │
│                       │  - report.service     │  - Badge, Level      │
└───────────────────────┴───────────────────────┴─────────────────────┘
                                    │
                              PostgreSQL
                                    │
┌─────────────────────────────────────────────────────────────────────┐
│  Tables: users, point_history, badges, user_badges, levels,         │
│          reward_history                                              │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 💾 Stockage des Points

### Base de données

#### Table `users`

Stocke le total de points de chaque utilisateur.

```sql
ALTER TABLE users ADD COLUMN points INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN level INTEGER NOT NULL DEFAULT 1;
```

| Colonne | Type | Description |
|---------|------|-------------|
| `points` | INTEGER | Total cumulé des points (≥ 0) |
| `level` | INTEGER | Niveau actuel (1-8) |

#### Table `point_history`

Historique détaillé de toutes les transactions de points.

```sql
CREATE TABLE point_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  points INTEGER NOT NULL,              -- Peut être négatif (débit)
  reason VARCHAR(50) NOT NULL,          -- 'report_validated', 'badge_earned', etc.
  description TEXT,                     -- Description lisible
  reference_id UUID,                    -- ID de la ressource liée
  reference_type VARCHAR(50),           -- 'Report', 'Badge', etc.
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Raisons supportées** (`reason`):

| Valeur | Description | Points |
|--------|-------------|--------|
| `report_validated` | Signalement validé | +10 |
| `badge_earned` | Badge obtenu | +5 à +100 |
| `admin_adjustment` | Ajustement manuel | Variable |

### Modèle Sequelize

**Fichier**: `backend/src/models/user.model.js`

```javascript
points: { 
  type: DataTypes.INTEGER, 
  allowNull: false, 
  defaultValue: 0, 
  validate: { min: 0 } 
},
level: { 
  type: DataTypes.INTEGER, 
  allowNull: false, 
  defaultValue: 1 
}
```

**Fichier**: `backend/src/models/pointHistory.model.js`

```javascript
module.exports = (sequelize) => {
  const PointHistory = sequelize.define("PointHistory", {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false, field: "user_id" },
    points: { type: DataTypes.INTEGER, allowNull: false },
    reason: { type: DataTypes.STRING(50), allowNull: false },
    description: { type: DataTypes.TEXT },
    referenceId: { type: DataTypes.UUID, field: "reference_id" },
    referenceType: { type: DataTypes.STRING(50), field: "reference_type" },
  }, {
    tableName: "point_history",
    timestamps: true,
    underscored: true,
    updatedAt: false, // Historique immuable
  });
  return PointHistory;
};
```

### Migrations

| Fichier | Description |
|---------|-------------|
| `20241223000001-add-user-points.js` | Ajoute `points` et `level` à users |
| `20241223000002-create-point-history.js` | Crée la table point_history |
| `20241223000004-create-rewards-system.js` | Crée badges, levels, reward_history |

---

## ⭐ Attribution des Points

### Service Principal

**Fichier**: `backend/src/services/point.service.js`

#### Constantes

```javascript
const POINTS_PER_VALID_REPORT = 10;
```

#### Méthodes

##### `addPoints(userId, points, reason, description, referenceId, referenceType)`

Ajoute des points à un utilisateur et enregistre dans l'historique.

```javascript
const addPoints = async (userId, points, reason, description = null, referenceId = null, referenceType = null) => {
  // 1. Créer l'entrée dans l'historique
  await PointHistory.create({
    userId,
    points,
    reason,
    description,
    referenceId,
    referenceType,
  });

  // 2. Mettre à jour le total de l'utilisateur
  await User.increment("points", { by: points, where: { id: userId } });

  // 3. Retourner l'utilisateur mis à jour
  return User.findByPk(userId);
};
```

##### `creditReportPoints(userId, reportId)`

Crédite les points pour un signalement validé.

```javascript
const creditReportPoints = async (userId, reportId) => {
  return addPoints(
    userId,
    POINTS_PER_VALID_REPORT,
    "report_validated",
    `Signalement #${reportId.slice(0, 8)} validé`,
    reportId,
    "Report"
  );
};
```

### Déclenchement

**Fichier**: `backend/src/services/report.service.js`

```javascript
const validateReport = async (reportId, adminId) => {
  const report = await Report.findByPk(reportId);
  
  // 1. Mettre à jour le statut
  await report.update({
    status: "validated",
    validatedAt: new Date(),
    validatedBy: adminId,
  });

  // 2. Attribuer les points
  await pointService.creditReportPoints(report.userId, report.id);

  // 3. Vérifier et attribuer badges/niveaux
  const rewards = await rewardService.processRewardsAfterActivity(report.userId);

  return { report, rewards };
};
```

### Flux d'attribution

```
┌──────────────────┐     ┌─────────────────┐     ┌──────────────────┐
│ Admin valide     │────▶│ reportService   │────▶│ pointService     │
│ PUT /reports/:id │     │ validateReport()│     │ creditReportPts()│
└──────────────────┘     └─────────────────┘     └────────┬─────────┘
                                                          │
                         ┌─────────────────┐              │
                         │ rewardService   │◀─────────────┘
                         │ processRewards()│
                         └────────┬────────┘
                                  │
              ┌───────────────────┼───────────────────┐
              ▼                   ▼                   ▼
    ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
    │ checkAndAward   │ │ checkAndUpdate  │ │ Retour rewards  │
    │ Badges()        │ │ Level()         │ │ au controller   │
    └─────────────────┘ └─────────────────┘ └─────────────────┘
```

---

## 📱 Affichage des Points

### Backend - API Responses

#### Login (`POST /api/auth/login`)

```json
{
  "success": true,
  "token": "jwt...",
  "user": {
    "id": "uuid",
    "firstname": "Marie",
    "lastname": "Dupont",
    "email": "marie@example.com",
    "role": "user",
    "points": 150,
    "level": 3
  }
}
```

#### Profil (`GET /api/auth/me`)

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "firstname": "Marie",
      "lastname": "Dupont",
      "email": "marie@example.com",
      "role": "user",
      "isActive": true,
      "points": 150,
      "level": 3,
      "createdAt": "2024-12-20T10:00:00.000Z"
    }
  }
}
```

#### Validation Report (`PUT /api/reports/:id/validate`)

```json
{
  "success": true,
  "message": "Signalement validé avec succès. 10 points attribués. Nouveau badge obtenu: Éco-Citoyen. Niveau supérieur atteint: Apprenti Écolo (niveau 2)",
  "data": {
    "report": { ... },
    "rewards": {
      "badges": [{ "name": "Éco-Citoyen", "description": "..." }],
      "levelUp": { "level": 2, "name": "Apprenti Écolo" }
    }
  }
}
```

### Frontend - Contextes

#### AuthContext

**Fichier**: `frontend/src/contexts/AuthContext.jsx`

```jsx
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // Récupère le profil utilisateur avec points
  const fetchProfile = async () => {
    const response = await api.get('/auth/me');
    setUser(response.data.data.user);
  };

  // Rafraîchit les données après une action
  const refreshUser = () => {
    if (isAuthenticated) fetchProfile();
  };

  return (
    <AuthContext.Provider value={{ user, refreshUser, ... }}>
      {children}
    </AuthContext.Provider>
  );
}
```

#### NotificationContext

**Fichier**: `frontend/src/contexts/NotificationContext.jsx`

```jsx
const notify = {
  // Notification de points gagnés
  points: (amount, reason = '') =>
    addNotification({
      type: 'points',
      message: `+${amount} points${reason ? ` - ${reason}` : ''}`,
      title: 'Points gagnés !',
      icon: '⭐',
    }),

  // Notification de badge
  badge: (badgeName, description) =>
    addNotification({
      type: 'badge',
      message: description,
      title: 'Nouveau badge !',
      icon: '🏆',
    }),

  // Notification de niveau
  levelUp: (newLevel, levelName) =>
    addNotification({
      type: 'level_up',
      message: `Vous êtes maintenant "${levelName}"`,
      title: 'Niveau supérieur !',
      icon: '🎉',
    }),
};
```

### Frontend - Composants

#### Navbar

**Fichier**: `frontend/src/components/layout/Navbar.jsx`

```jsx
export default function Navbar() {
  const { user } = useAuth();

  return (
    <nav>
      {user && (
        <div className="user-stats">
          <span className="points-badge">
            ⭐ {user.points ?? 0} pts
          </span>
          <span className="level-badge">
            Niv. {user.level ?? 1}
          </span>
        </div>
      )}
    </nav>
  );
}
```

#### RewardNotification

**Fichier**: `frontend/src/components/notifications/RewardNotification.jsx`

Affiche des notifications visuelles animées pour :
- Points gagnés (fond doré, icône ⭐)
- Badges obtenus (fond violet, icône 🏆, animation bounce)
- Montée de niveau (fond vert, icône 🎉, animation shine)

---

## 🔄 Flux Complet

### Scénario : Validation d'un signalement

```
1. ADMIN: PUT /api/reports/:id/validate
   │
2. BACKEND: report.service.validateReport()
   ├── Update report.status = 'validated'
   ├── pointService.creditReportPoints() → +10 points
   │   ├── Insert into point_history
   │   └── Update users.points += 10
   └── rewardService.processRewardsAfterActivity()
       ├── checkAndAwardBadges() → badges éventuels
       └── checkAndUpdateLevel() → level up éventuel
   │
3. RESPONSE: { report, rewards: { badges, levelUp } }
   │
4. FRONTEND (Admin): Affiche message succès
   │
5. FRONTEND (User): 
   ├── refreshUser() → GET /api/auth/me
   ├── Navbar mis à jour avec nouveaux points/niveau
   └── Notifications affichées pour récompenses
```

---

## 🔌 API Endpoints

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| POST | `/api/auth/login` | ❌ | Retourne user avec points/level |
| POST | `/api/auth/register` | ❌ | Retourne user avec points=0, level=1 |
| GET | `/api/auth/me` | 🔒 JWT | Profil complet avec points/level |
| PUT | `/api/reports/:id/validate` | 🔒 Admin | Valide et attribue points |

---

## 🧪 Tests

### Tests unitaires

**Fichier**: `backend/__tests__/points.attribution.test.js`

| Test | Description |
|------|-------------|
| `creditReportPoints` | Vérifie +10 points pour signalement |
| `addPoints` | Vérifie création historique |
| `getUserPointHistory` | Vérifie récupération historique |

**Fichier**: `backend/__tests__/rewards.attribution.test.js`

| Test | Description |
|------|-------------|
| `checkAndAwardBadges` | Vérifie attribution badges |
| `checkAndUpdateLevel` | Vérifie passage de niveau |
| `processRewardsAfterActivity` | Vérifie flux complet |

### Exécution

```bash
cd backend
npm test
```

**Résultat attendu**: 114 tests passing

---

## 📁 Fichiers Concernés

### Backend

```
backend/
├── src/
│   ├── models/
│   │   ├── user.model.js          # Champs points, level
│   │   ├── pointHistory.model.js  # Historique transactions
│   │   ├── badge.model.js         # Définition badges
│   │   └── level.model.js         # Définition niveaux
│   ├── services/
│   │   ├── point.service.js       # Attribution points
│   │   ├── reward.service.js      # Badges et niveaux
│   │   └── report.service.js      # Déclencheur (validation)
│   ├── controllers/
│   │   ├── auth.controller.js     # Retourne points dans responses
│   │   └── report.controller.js   # Endpoint validation
│   └── routes/
│       └── auth.routes.js         # Route GET /auth/me
└── __tests__/
    ├── points.attribution.test.js
    └── rewards.attribution.test.js
```

### Frontend

```
frontend/
└── src/
    ├── contexts/
    │   ├── AuthContext.jsx        # State user.points
    │   └── NotificationContext.jsx # Notifications récompenses
    ├── components/
    │   ├── layout/
    │   │   └── Navbar.jsx         # Affichage points/niveau
    │   └── notifications/
    │       ├── RewardNotification.jsx
    │       └── RewardNotification.css
    └── pages/
        └── Home.jsx               # Affichage tableau de bord
```

### Database

```
database/
├── migrations/
│   ├── 20241223000001-add-user-points.js
│   ├── 20241223000002-create-point-history.js
│   └── 20241223000004-create-rewards-system.js
└── seeders/
    ├── 20241223000001-default-badges-levels.js
    └── 20241223000002-demo-users.js  # Users avec points variés
```

---

## 🔗 Documents Connexes

- [Événements Déclenchant des Récompenses](./reward-events.md)
- [Structure du Projet](./architecture/structure-projet.md)
- [Conventions de Nommage](./conventions/nommage.md)
