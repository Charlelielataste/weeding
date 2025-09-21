# Configuration Backblaze B2

## Étapes de configuration :

### 1. **Créer un compte Backblaze B2**

- Allez sur [backblaze.com](https://www.backblaze.com/cloud-storage)
- Créez un compte (10 GB gratuits)

### 2. **Créer un bucket**

- Dans la console B2 → "Buckets" → "Create a Bucket"
- Nom du bucket : `mariage-photos-videos` (ou autre)
- Type : **Public** (pour que les images soient accessibles)
- Région : Europe (si vous êtes en Europe)

### 3. **Créer une clé d'application**

- Console B2 → "App Keys" → "Add a New Application Key"
- Nom : `weeding-app`
- Type : **Master Application Key** (ou limité au bucket)
- Copiez l'**Application Key ID** et l'**Application Key**

### 4. **Trouver l'endpoint et l'URL publique**

- Dans votre bucket → onglet "Settings"
- Notez l'**Endpoint** (ex: `https://s3.us-west-004.backblazeb2.com`)
- Notez l'**URL publique** (ex: `https://f004.backblazeb2.com/file/mariage-photos-videos`)

### 5. **Configurer .env.local**

Remplacez votre `.env.local` par :

```env
# Configuration Backblaze B2
B2_ENDPOINT=https://s3.us-west-004.backblazeb2.com
B2_REGION=us-west-004
B2_APPLICATION_KEY_ID=votre_application_key_id
B2_APPLICATION_KEY=votre_application_key
B2_BUCKET_NAME=mariage-photos-videos
B2_PUBLIC_URL=https://f004.backblazeb2.com/file/mariage-photos-videos
```

### 6. **Installer les dépendances**

```bash
npm install @aws-sdk/client-s3
```

### 7. **Tester**

```bash
npm run dev
```

## Avantages de B2 vs Google Drive :

✅ **Plus simple** - Pas de service accounts  
✅ **Moins cher** - 10 GB gratuits puis $0.005/GB  
✅ **Plus rapide** - API native pour le web  
✅ **Plus fiable** - Moins de limitations de quota  
✅ **URLs directes** - Accès direct aux fichiers

## Structure des fichiers :

```
bucket/
├── photos/
│   ├── 1234567890_photo1.jpg
│   └── 1234567890_photo2.jpg
└── videos/
    ├── 1234567890_video1.mp4
    └── 1234567890_video2.mp4
```
