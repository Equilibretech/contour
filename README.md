# 🖼️ Suppresseur de Fond Blanc

Un outil web simple et efficace pour supprimer automatiquement les fonds blancs ou presque blancs des images PNG, JPG et JPEG.

## ✨ Fonctionnalités

- **Interface intuitive** : Glissez-déposez ou sélectionnez vos images
- **Traitement en temps réel** : Prévisualisation immédiate des résultats
- **Contrôles avancés** :
  - Seuil de blanc configurable (200-255)
  - Tolérance pour l'antialiasing (0-50)
  - Option de lissage des bords
- **100% côté client** : Vos images ne quittent jamais votre navigateur
- **Export PNG** : Téléchargement direct avec canal alpha (transparence)
- **Responsive** : Compatible mobile et desktop

## 🚀 Utilisation

1. **Ouvrez** `index.html` dans votre navigateur
2. **Glissez** votre image dans la zone de drop ou cliquez pour parcourir
3. **Ajustez** les paramètres selon vos besoins :
   - **Seuil de blanc** : Plus la valeur est élevée, plus les pixels doivent être blancs pour être supprimés
   - **Tolérance** : Permet de gérer les variations de couleur près du blanc
   - **Lisser les bords** : Améliore le rendu en créant des transitions douces
4. **Cliquez** sur "Traiter l'image"
5. **Téléchargez** le résultat en PNG avec transparence

## 🛠️ Technologies utilisées

- **HTML5** : Structure de l'interface
- **CSS3** : Design moderne avec Flexbox/Grid
- **JavaScript ES6+** : Logique de traitement d'images
- **Canvas API** : Manipulation des pixels d'image
- **FileReader API** : Lecture des fichiers locaux

## 📁 Structure du projet

```
suppresseur-fond-blanc/
├── index.html          # Interface utilisateur
├── style.css           # Styles et design
├── script.js           # Logique de traitement
└── README.md           # Documentation
```

## ⚙️ Algorithme de traitement

L'outil utilise un algorithme intelligent qui :

1. **Analyse chaque pixel** en composants RGB
2. **Calcule la luminosité** moyenne et la variation entre composants
3. **Applique le seuil** configuré pour identifier les pixels blancs
4. **Gère l'antialiasing** avec la tolérance pour préserver la qualité
5. **Lisse les bords** optionnellement pour un rendu professionnel
6. **Préserve la qualité** en traitant à la résolution originale pour l'export

## 🎯 Cas d'usage typiques

- **Logos et icônes** : Suppression de fonds blancs pour intégration web
- **Photos produits** : Nettoyage d'arrière-plans pour e-commerce
- **Documents scannés** : Élimination des fonds de papier blanc
- **Illustrations** : Préparation d'images pour compositions

## 💡 Conseils d'utilisation

### Pour les meilleurs résultats :

- **Images avec fond uni** : L'outil fonctionne mieux avec des fonds blancs homogènes
- **Seuil optimal** : Commencez avec 240, ajustez selon le résultat
- **Tolérance** : Augmentez (20-30) pour les images avec du bruit ou compression JPEG
- **Lissage** : Activé par défaut, désactivez pour des contours nets

### Paramètres recommandés par type d'image :

| Type d'image | Seuil | Tolérance | Lissage |
|--------------|-------|-----------|---------|
| Logo vectoriel | 250 | 5 | ✅ |
| Photo produit | 240 | 15 | ✅ |
| Scan document | 235 | 25 | ❌ |
| Image compressée | 230 | 30 | ✅ |

## 🔒 Confidentialité

- **Traitement local** : Toutes les opérations s'effectuent dans votre navigateur
- **Aucun upload** : Vos images ne sont jamais envoyées sur un serveur
- **Données privées** : Vos fichiers restent sur votre machine

## 🌐 Compatibilité

- **Navigateurs modernes** : Chrome, Firefox, Safari, Edge
- **Formats supportés** : PNG, JPG, JPEG
- **Tailles d'image** : Limité par la mémoire du navigateur
- **Appareils** : Desktop et mobile

## 🐛 Résolution de problèmes

### L'image ne se charge pas
- Vérifiez le format (PNG, JPG, JPEG uniquement)
- Réduisez la taille si l'image est très lourde (>50MB)

### Le résultat n'est pas satisfaisant
- Ajustez le seuil : plus bas pour capturer plus de pixels
- Modifiez la tolérance : plus haut pour les images bruitées
- Désactivez le lissage pour des contours nets

### Performance lente
- Les grandes images (>4000px) peuvent prendre du temps
- Fermez les autres onglets pour libérer de la mémoire

## 📝 License

Ce projet est open source et libre d'utilisation pour tous usages personnels et commerciaux.

## 🤝 Contribution

Les améliorations et suggestions sont les bienvenues ! N'hésitez pas à proposer des fonctionnalités ou des corrections.

---

**Développé avec ❤️ pour simplifier la suppression de fonds d'images**