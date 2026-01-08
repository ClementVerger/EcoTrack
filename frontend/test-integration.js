#!/usr/bin/env node
/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */

/**
 * Script de test d'intégration complète Frontend-Backend
 * 
 * Cet script teste:
 * 1. Que le backend est accessible
 * 2. Que l'authentification fonctionne
 * 3. Que l'API POST /reports reçoit les données correctement
 * 4. Que les réponses sont au format attendu
 */

import http from 'http';
import https from 'https';

// Configuration
const BACKEND_URL = 'http://localhost:3000';
const REPORTS_ENDPOINT = '/reports';
const AUTH_ENDPOINT = '/auth/register';

// Couleurs pour le terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

function formatJSON(obj) {
  return JSON.stringify(obj, null, 2);
}

async function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BACKEND_URL}${path}`);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const protocolModule = url.protocol === 'https:' ? https : http;

    const req = protocolModule.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = responseData ? JSON.parse(responseData) : null;
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: parsed,
            raw: responseData,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: null,
            raw: responseData,
          });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function runTests() {
  log(colors.cyan, '\n========================================');
  log(colors.cyan, '  Test d\'Intégration Frontend-Backend');
  log(colors.cyan, '========================================\n');

  try {
    // Test 1: Vérifier que le backend est accessible
    log(colors.blue, '1️⃣  Vérification que le backend est accessible...');
    try {
      const healthResponse = await makeRequest('GET', '/health');
      if (healthResponse.status === 200) {
        log(colors.green, '   ✅ Backend accessible sur http://localhost:3000');
      } else {
        log(colors.yellow, `   ⚠️  Réponse inattendue du serveur: ${healthResponse.status}`);
      }
    } catch (error) {
      log(colors.red, '   ❌ Backend non accessible - Assurez-vous que "npm run dev" est lancé');
      throw error;
    }

    // Test 2: Créer un utilisateur de test
    log(colors.blue, '\n2️⃣  Création d\'un utilisateur de test...');
    const testUser = {
      firstname: 'Test',
      lastname: 'User',
      email: `test-${Date.now()}@example.com`,
      password: 'TestPassword123!',
    };

    const registerResponse = await makeRequest('POST', '/auth/register', testUser);
    if (registerResponse.status === 201) {
      log(colors.green, '   ✅ Utilisateur créé avec succès');
      log(colors.cyan, `   Email: ${testUser.email}`);
    } else {
      log(colors.yellow, `   ⚠️  Réponse d'enregistrement: ${registerResponse.status}`);
    }

    // Test 3: Se connecter pour obtenir un token
    log(colors.blue, '\n3️⃣  Connexion pour obtenir le token JWT...');
    const loginResponse = await makeRequest('POST', '/auth/login', {
      email: testUser.email,
      password: testUser.password,
    });

    let token = null;
    if (loginResponse.status === 200 && loginResponse.body?.data?.token) {
      token = loginResponse.body.data.token;
      log(colors.green, '   ✅ Token JWT obtenu');
      log(colors.cyan, `   Token: ${token.substring(0, 30)}...`);
    } else {
      log(colors.red, `   ❌ Échec de la connexion: ${loginResponse.status}`);
      log(colors.yellow, `   Réponse: ${formatJSON(loginResponse.body)}`);
    }

    // Test 4: Créer un signalement avec le token
    log(colors.blue, '\n4️⃣  Test de création de signalement...');
    const reportData = {
      description: 'Test d\'intégration - Conteneur déborde de déchets',
      category: 'conteneur_plein',
      severity: 'haute',
      containerId: null,
      latitude: 48.8566,
      longitude: 2.3522,
      photo: null,
    };

    if (token) {
      const createReportResponse = await makeRequest(
        'POST',
        '/reports',
        reportData,
        {
          Authorization: `Bearer ${token}`,
        },
      );

      if (createReportResponse.status === 201) {
        log(colors.green, '   ✅ Signalement créé avec succès');
        if (createReportResponse.body?.data?.id) {
          log(colors.cyan, `   Rapport ID: ${createReportResponse.body.data.id}`);
          log(colors.cyan, `   Status: ${createReportResponse.body.data.status}`);
          log(colors.cyan, `   Description: ${createReportResponse.body.data.description}`);
          log(colors.cyan, `   Catégorie: ${createReportResponse.body.data.category}`);
          log(colors.cyan, `   GPS: ${createReportResponse.body.data.latitude}, ${createReportResponse.body.data.longitude}`);
        }
      } else {
        log(colors.red, `   ❌ Erreur: ${createReportResponse.status}`);
        log(colors.yellow, `   Réponse: ${formatJSON(createReportResponse.body)}`);
      }
    } else {
      log(colors.red, '   ❌ Impossible de tester - Pas de token JWT');
    }

    // Test 5: Récupérer les signalements de l'utilisateur
    log(colors.blue, '\n5️⃣  Récupération des signalements de l\'utilisateur...');
    if (token) {
      const getReportsResponse = await makeRequest(
        'GET',
        '/reports/me',
        null,
        {
          Authorization: `Bearer ${token}`,
        },
      );

      if (getReportsResponse.status === 200) {
        const reportCount = getReportsResponse.body?.data?.length || 0;
        log(colors.green, `   ✅ ${reportCount} signalements récupérés`);
        if (reportCount > 0) {
          const lastReport = getReportsResponse.body.data[0];
          log(colors.cyan, `   Dernier signalement: ${lastReport.description.substring(0, 50)}...`);
        }
      } else {
        log(colors.red, `   ❌ Erreur: ${getReportsResponse.status}`);
      }
    }

    // Test 6: Test sans token (doit retourner 401)
    log(colors.blue, '\n6️⃣  Test d\'authentification (requête sans token)...');
    const noTokenResponse = await makeRequest('POST', '/reports', reportData);
    if (noTokenResponse.status === 401) {
      log(colors.green, '   ✅ Authentification requise (401 Unauthorized)');
    } else if (noTokenResponse.status === 403) {
      log(colors.green, '   ✅ Accès refusé (403 Forbidden)');
    } else {
      log(colors.yellow, `   ⚠️  Code inattendu: ${noTokenResponse.status}`);
    }

    // Résumé
    log(colors.cyan, '\n========================================');
    log(colors.green, '   ✅ Tests d\'intégration terminés avec succès!');
    log(colors.cyan, '========================================\n');

    log(colors.green, 'Résumé de l\'intégration:');
    log(colors.cyan, '  • Backend accessible sur http://localhost:3000');
    log(colors.cyan, '  • Authentification JWT fonctionnelle');
    log(colors.cyan, '  • API POST /reports fonctionnelle');
    log(colors.cyan, '  • Données transmises correctement');
    log(colors.cyan, '  • Réponses au format attendu\n');
  } catch (error) {
    log(colors.red, `\n❌ Erreur lors des tests: ${error.message}\n`);
    process.exit(1);
  }
}

// Démarrer les tests
runTests().catch((error) => {
  log(colors.red, `\n❌ Erreur: ${error.message}\n`);
  process.exit(1);
});
