/**
 * Récupère les variables d'environnement de manière compatible avec Vite et Jest
 */
export function getEnv(key, defaultValue = '') {
  // En environnement Jest/Node (tests)
  if (typeof process !== 'undefined' && process.env) {
    const value = process.env[key];
    if (value) return value;
  }
  
  // En environnement Vite (navigateur) - utiliser eval pour éviter parse error dans Jest
  if (typeof window !== 'undefined') {
    try {
      // eslint-disable-next-line no-eval
      const importMeta = eval('import.meta');
      if (importMeta?.env?.[key]) {
        return importMeta.env[key];
      }
    } catch (e) {
      // eval non disponible ou erreur - continuer
    }
  }
  
  return defaultValue;
}
