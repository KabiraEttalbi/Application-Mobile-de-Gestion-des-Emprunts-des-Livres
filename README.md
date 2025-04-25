
# 📚 Application Mobile de Gestion des Emprunts de Livres

Une application mobile complète développée avec **React Native (Expo)** et une **API REST en Next.js**, permettant à une communauté de gérer le prêt et le retour de livres. L’interface est intuitive, et le backend sécurisé repose sur **MongoDB**.

---

## ✨ Fonctionnalités

- Authentification sécurisée (JWT)
- Gestion des utilisateurs et rôles (`user` / `admin`)
- Liste, ajout, modification et suppression de livres
- Emprunt et retour de livres
- Historique des emprunts
- Interface d’administration (gestion des utilisateurs et emprunts)
- Recherche et filtrage de livres

---

## 🛠 Structure du projet

```bash
.
├── book-tracker/       # Application mobile React Native
└── book-api/        # API Next.js + MongoDB
```

---

## 🧑‍💻 Technologies

### 🔹 Frontend (React Native avec Expo)
- React Native
- Expo
- React Navigation
- Axios
- AsyncStorage

### 🔹 Backend (Next.js API)
- Next.js (API routes)
- MongoDB (MongoDB Atlas)
- JWT (authentification)
- bcrypt (sécurité)
- TypeScript

---

## 🚀 Installation et exécution

### 1. Cloner le dépôt

```bash
git clone https://github.com/KabiraEttalbi/Application-Mobile-de-Gestion-des-Emprunts-des-Livres.git
cd Application-Mobile-de-Gestion-des-Emprunts-des-Livres
```

### 2. Lancer l’API (backend)

```bash
cd book-api
npm install
npm run dev
```

> 📌 Crée un fichier `.env` avec les variables suivantes :
```
MONGODB_URI=<votre URI MongoDB Atlas>
JWT_SECRET=<votre clé secrète>
```

### 3. Lancer l’application mobile (frontend)

```bash
cd ../book-tracker
npm install
npx expo start
```

> Ouvre **Expo Go** sur ton téléphone et scanne le QR code pour lancer l’application.


---

## Auteur

**Kabira Ettalbi**  
📧 [ettalbi.k132@ucd.ac.ma]  
🔗 [GitHub – KabiraEttalbi](https://github.com/KabiraEttalbi)

---

