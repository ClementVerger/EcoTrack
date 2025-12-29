# Événements Utilisateurs Déclenchant des Récompenses

Ce document liste et documente tous les événements utilisateurs qui déclenchent l'attribution de récompenses dans EcoTrack.

---

## 📋 Vue d'ensemble

| Type de récompense | Déclencheur | Automatique |
|--------------------|-------------|-------------|
| Points | Signalement validé | ✅ Oui |
| Points | Obtention de badge | ✅ Oui |
| Badge | Seuil de signalements atteint | ✅ Oui |
| Badge | Seuil de points atteint | ✅ Oui |
| Badge | Jours consécutifs (streak) | ✅ Oui |
| Badge | Attribution manuelle (admin) | ❌ Non |
| Niveau | Seuil de points atteint | ✅ Oui |

---

## 🎯 Événements Détaillés

### 1. Signalement Validé (`report_validated`)

**Déclencheur**: Un administrateur valide un signalement soumis par l'utilisateur.

| Propriété | Valeur |
|-----------|--------|
| **Endpoint** | `PUT /api/reports/:id/validate` |
| **Points attribués** | +10 points |
| **Récompenses cascadées** | Badges, Level up |
| **Service** | `report.service.validateReport()` |

**Flux**:
```
Validation signalement → +10 points → Vérification badges → Vérification niveau
```

**Exemple de payload historique**:
```json
{
  "userId": "uuid",
  "points": 10,
  "reason": "report_validated",
  "description": "Signalement #abc12345 validé",
  "referenceId": "report-uuid",
  "referenceType": "Report"
}
```

---

### 2. Obtention de Badge (`badge_earned`)

**Déclencheur**: L'utilisateur remplit les conditions d'un badge.

| Propriété | Valeur |
|-----------|--------|
| **Vérification** | Après chaque activité récompensée |
| **Points attribués** | Variable selon le badge (5-100 points) |
| **Service** | `reward.service.checkAndAwardBadges()` |

**Conditions supportées**:

| `condition_type` | Description | Exemple |
|------------------|-------------|---------|
| `reports_count` | Nombre de signalements validés | ≥ 10 signalements |
| `points_total` | Total de points accumulés | ≥ 500 points |
| `streak_days` | Jours consécutifs d'activité | 7 jours d'affilée |
| `manual` | Attribution par un admin | Pionnier, événement spécial |

**Exemple de payload historique**:
```json
{
  "userId": "uuid",
  "rewardType": "badge",
  "rewardId": "badge-uuid",
  "description": "Badge \"Éco-Citoyen\" obtenu",
  "metadata": {
    "badgeCode": "REPORTER_10",
    "pointsReward": 20
  }
}
```

---

### 3. Passage de Niveau (`level_up`)

**Déclencheur**: Le total de points de l'utilisateur atteint le seuil du niveau suivant.

| Propriété | Valeur |
|-----------|--------|
| **Vérification** | Après chaque ajout de points |
| **Service** | `reward.service.checkAndUpdateLevel()` |

**Seuils de niveau**:

| Niveau | Nom | Points requis | Icône |
|--------|-----|---------------|-------|
| 1 | Débutant | 0 | 🌱 |
| 2 | Apprenti | 50 | 🌿 |
| 3 | Éco-Citoyen | 150 | 🌳 |
| 4 | Protecteur | 300 | 🛡️ |
| 5 | Gardien | 500 | 🦸 |
| 6 | Champion | 800 | 🏅 |
| 7 | Héros | 1200 | 🏆 |
| 8 | Légende | 2000 | 👑 |

**Exemple de payload historique**:
```json
{
  "userId": "uuid",
  "rewardType": "level_up",
  "rewardId": "level-uuid",
  "description": "Passage au niveau 3 - Éco-Citoyen",
  "metadata": {
    "oldLevel": 2,
    "newLevel": 3,
    "levelName": "Éco-Citoyen"
  }
}
```

---

### 4. Bonus Administrateur (`bonus`)

**Déclencheur**: Un administrateur attribue manuellement des points ou un badge.

| Propriété | Valeur |
|-----------|--------|
| **Endpoint badge** | `POST /api/rewards/badges/award` (à implémenter) |
| **Endpoint points** | `POST /api/rewards/points/add` (à implémenter) |
| **Service** | `reward.service.awardBadgeManually()` |

**Exemple de payload historique**:
```json
{
  "userId": "uuid",
  "points": 50,
  "reason": "bonus",
  "description": "Bonus pour badge \"Pionnier\"",
  "referenceId": "badge-uuid",
  "referenceType": "Badge"
}
```

---

### 5. Pénalité (`penalty`)

**Déclencheur**: Action administrative pour retirer des points (abus, fraude, etc.).

| Propriété | Valeur |
|-----------|--------|
| **Points** | Négatifs (retrait) |
| **Minimum** | Les points ne descendent pas en dessous de 0 |
| **Service** | `point.service.addPoints()` avec points négatifs |

**Exemple de payload historique**:
```json
{
  "userId": "uuid",
  "points": -50,
  "reason": "penalty",
  "description": "Signalements abusifs détectés",
  "referenceId": null,
  "referenceType": null
}
```

---

## 🏅 Catalogue des Badges

### Catégorie: Signalements (`reports`)

| Code | Nom | Condition | Bonus |
|------|-----|-----------|-------|
| `FIRST_REPORT` | Premier Pas | 1 signalement validé | +5 pts |
| `REPORTER_10` | Éco-Citoyen | 10 signalements validés | +20 pts |
| `REPORTER_50` | Gardien Vert | 50 signalements validés | +50 pts |
| `REPORTER_100` | Champion Écologique | 100 signalements validés | +100 pts |

### Catégorie: Points (`points`)

| Code | Nom | Condition | Bonus |
|------|-----|-----------|-------|
| `POINTS_100` | Collectionneur Bronze | 100 points | +10 pts |
| `POINTS_500` | Collectionneur Argent | 500 points | +25 pts |
| `POINTS_1000` | Collectionneur Or | 1000 points | +50 pts |

### Catégorie: Régularité (`streak`)

| Code | Nom | Condition | Bonus |
|------|-----|-----------|-------|
| `STREAK_7` | Régularité | 7 jours consécutifs | +30 pts |

### Catégorie: Spécial (`special`)

| Code | Nom | Condition | Bonus |
|------|-----|-----------|-------|
| `EARLY_ADOPTER` | Pionnier | Attribution manuelle | +50 pts |

---

## 🔄 Diagramme de Flux

```
┌──────────────────────────────────────────────────────────────────┐
│                    ÉVÉNEMENT UTILISATEUR                         │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                  Signalement validé par admin                    │
│                  PUT /api/reports/:id/validate                   │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│              1. Créditer +10 points                              │
│                 pointService.creditReportPoints()                │
│                 → Entrée dans point_history                      │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│              2. Vérifier badges éligibles                        │
│                 rewardService.checkAndAwardBadges()              │
│                 → Pour chaque badge obtenu:                      │
│                   - Entrée dans user_badges                      │
│                   - Entrée dans reward_history                   │
│                   - Bonus points si applicable                   │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│              3. Vérifier passage de niveau                       │
│                 rewardService.checkAndUpdateLevel()              │
│                 → Si level up:                                   │
│                   - Mise à jour user.level                       │
│                   - Entrée dans reward_history                   │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│              4. Retourner résumé des récompenses                 │
│                 { report, rewards: { badges, levelUp } }         │
└──────────────────────────────────────────────────────────────────┘
```

---

## 📊 Tables de Stockage

| Table | Description |
|-------|-------------|
| `point_history` | Historique des points gagnés/perdus |
| `reward_history` | Historique des badges et level ups |
| `user_badges` | Badges obtenus par chaque utilisateur |
| `badges` | Définition des badges disponibles |
| `levels` | Définition des niveaux |

---

## 🚀 Événements Futurs (Roadmap)

| Événement | Description | Statut |
|-----------|-------------|--------|
| `streak_days` | Récompense pour jours consécutifs | 🔜 À implémenter |
| `first_login_daily` | Bonus de connexion quotidienne | 📋 Planifié |
| `referral` | Parrainage d'un nouvel utilisateur | 📋 Planifié |
| `container_types` | Signaler X types de conteneurs différents | 📋 Planifié |
| `zone_explorer` | Signaler dans X zones différentes | 📋 Planifié |
| `weekend_warrior` | Signaler pendant le week-end | 📋 Planifié |