# League of Legends Pédantix – Backend

Backend du jeu Pédantix version League of Legends. Le but : deviner le champion du jour à partir de sa page [Universe](https://universe.leagueoflegends.com/fr_FR/).


NAUD Mattis   
SIMON Melvin   
CLENET Alexandre  
[Git Tasks](https://github.com/orgs/MMA-Project/projects/1/views/1)

---


## Sommaire

- [League of Legends Pédantix – Backend](#league-of-legends-pédantix--backend)
  - [Sommaire](#sommaire)
  - [Prérequis](#prérequis)
  - [Installation](#installation)
  - [Lancement du projet](#lancement-du-projet)
  - [Structure du projet](#structure-du-projet)
  - [API et Routes](#api-et-routes)
  - [Cron et données](#cron-et-données)
  - [Erreurs personnalisées](#erreurs-personnalisées)

---

## Prérequis

- Node.js v18+
- MongoDB (local ou distant)
-  `npm`

---

## Installation

```bash
git clone https://github.com/MMA-Project/LoL-Pedentix-Backend.git
cd LoL-Pedentix-Backend
npm install
```
Créer un fichier `.env` à la racine du projet avec les variables d'environnement nécessaires. Un exemple est fourni dans `.env.example`.

Installer Postman pour tester les routes : https://www.postman.com/downloads/   
Pour POSTMAN une collection est disponible à la racine de projet

Pour lancer Mongo en local [TUTO](https://www.mongodb.com/try/download/community)  
[MongoDB Compass](https://www.mongodb.com/fr-fr/products/tools/compass) (pour avoir un GUI si besoin pour créer les tables)

Créer une base de donnée `pedantix` avec une collection `champions` et importer les données depuis `.src/data/champions/champions.json`, les autres collections seront créées avec le lancement du back.

## Lancement du projet

En mode développement :
```bash
npm run dev
```

Pour les tests :
```bash
npm test
```

## Structure du projet

```txt
src/
├── controller/           # Contrôleurs Express
├── data/                 # Données JSON utilisées (champions, parties)
├── errors/               # Classes d’erreurs personnalisées
├── middleware.ts         # Middleware globaux
├── index.ts              # Point d'entrée de l'app
├── repository/           # Accès aux données MongoDB
├── routes/               # Routeur Express
├── service/              # Logique métier (modèles + services)
├── utils/                # Fonctions utilitaires (mots, seed, etc.)
```

## API et Routes
Les routes sont définies dans `src/routes/index.ts`.

Elles s'appuient sur les contrôleurs dans `src/controller/`.

## Cron et données
Le fichier suivant exécute des tâches planifiées qui mets à jour les données du jeu, comme le champion du jour et gérer l’historique des parties.:
```bash
src/service/cron/game.cron.ts
```

Les données de base (champions, parties jouées) se trouvent dans :
```bash
src/data/
```

## Erreurs personnalisées

Le projet utilise des classes d’erreurs pour une gestion fine :

NotFound.error.ts

BadRequest.error.ts

NotModified.error.ts

StatusCodeHandler.ts