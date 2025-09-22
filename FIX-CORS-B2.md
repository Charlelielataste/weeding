# 🔧 Configuration CORS Backblaze B2

## Problème identifié ✅

L'erreur CORS confirme que :

- ✅ Votre API presigned URL fonctionne
- ✅ La configuration B2 est correcte
- ❌ Le bucket B2 n'autorise pas les uploads CORS depuis localhost

## Solution : Configurer CORS sur B2

### 1. Aller dans la console Backblaze B2

1. Connectez-vous à [secure.backblaze.com](https://secure.backblaze.com)
2. Allez dans **"Buckets"**
3. Cliquez sur votre bucket **"mariage-jo-kevin"**

### 2. Configurer CORS

1. Dans votre bucket → onglet **"Settings"**
2. Scrollez jusqu'à **"CORS Rules"**
3. Cliquez **"Add CORS Rule"**

### 3. Règle CORS pour développement

```json
{
  "corsRuleName": "AllowLocalDev",
  "allowedOrigins": ["http://localhost:3000", "http://127.0.0.1:3000"],
  "allowedHeaders": ["*"],
  "allowedOperations": ["s3_put"],
  "maxAgeSeconds": 3600
}
```

### 4. Règle CORS pour production (ajoutez aussi)

```json
{
  "corsRuleName": "AllowProduction",
  "allowedOrigins": [
    "https://votre-domaine.vercel.app",
    "https://votre-domaine.com"
  ],
  "allowedHeaders": ["*"],
  "allowedOperations": ["s3_put"],
  "maxAgeSeconds": 3600
}
```

### 5. Interface B2 (méthode visuelle)

Si vous préférez l'interface graphique :

1. **Allowed Origins** : `http://localhost:3000`
2. **Allowed Headers** : `*` (ou laissez vide)
3. **Allowed Operations** : Cochez `PUT`
4. **Max Age Seconds** : `3600`

### 6. Sauvegarder et tester

1. Cliquez **"Save CORS Rules"**
2. Attendez 1-2 minutes (propagation)
3. Retestez l'upload de vidéo

## 🧪 Test après configuration

Une fois CORS configuré, vous devriez voir dans la console :

```
✅ URL pré-signée reçue: {...}
🚀 Upload direct vers B2...
📊 Réponse upload B2: { status: 200, ok: true }
✅ Upload direct réussi
```

## ⚠️ Important

- **Développement** : Autorisez `http://localhost:3000`
- **Production** : Autorisez votre vrai domaine (ex: Vercel)
- **Sécurité** : Ne mettez pas `*` en production pour `allowedOrigins`

## 🔍 Vérification

Après avoir configuré CORS, l'erreur devrait disparaître et l'upload fonctionner normalement.

Si le problème persiste après 5 minutes, vérifiez :

1. Que la règle CORS est bien sauvegardée
2. Que l'origine est exactement `http://localhost:3000`
3. Que `s3_put` est bien autorisé
