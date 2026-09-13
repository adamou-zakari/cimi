# 🌾 UNIDO AfricaRice - Rice Quality Assessment Challenge

## 🎯 Objectif

Développer un modèle de vision par ordinateur capable d'évaluer la qualité du riz à partir d'images, en prédisant 15 variables de qualité différentes.

**Prize Pool**: $5,000 USD  
**Métrique**: Mean Absolute Error (MAE) moyenné sur 15 variables  
**Deadline**: 2 février 2026

---

## 📊 Variables à Prédire

### 1. Comptage et Structure (4 variables)
- `Count`: Nombre total de grains
- `Broken_Count`: Nombre de grains cassés
- `Long_Count`: Nombre de grains longs
- `Medium_Count`: Nombre de grains moyens

### 2. Couleur des Grains (5 variables)
- `Black_Count`: Grains noirs
- `Chalky_Count`: Grains crayeux
- `Red_Count`: Grains rouges
- `Yellow_Count`: Grains jaunes
- `Green_Count`: Grains verts

### 3. Dimensions (3 variables)
- `WK_Length_Average`: Longueur moyenne
- `WK_Width_Average`: Largeur moyenne
- `WK_LW_Ratio_Average`: Ratio longueur/largeur

### 4. Colorimétrie CIELAB (3 variables)
- `Average_L`: Luminosité
- `Average_a`: Axe vert-rouge
- `Average_b`: Axe bleu-jaune

---

## 🏆 Classement Actuel (Top 10)

| Rang | Équipe | Score Public | Observations |
|------|--------|--------------|--------------|
| 1 | Adamou | -0.210901 | ⚠️ Score négatif inhabituel |
| 2 | AfricaRais | 0.927083 | 🎯 Benchmark à battre |
| 3 | Liquide | 0.926478 | |
| 4 | Mohamed³ | 0.926024 | |
| 5 | Abdourahamane_ | 0.922732 | |

**Objectif**: Atteindre un score > 0.93 pour entrer dans le Top 3

---

## 📁 Structure du Projet

```
rice-quality-challenge/
│
├── data/
│   ├── Train.csv                    # Données d'entraînement
│   ├── Test.csv                     # Données de test
│   └── SampleSubmission.csv         # Format de soumission
│
├── images/
│   ├── paddy/                       # Images de riz rizé
│   ├── brown/                       # Images de riz complet
│   └── white/                       # Images de riz blanc
│
├── models/                          # Modèles entraînés
├── outputs/                         # Soumissions et résultats
├── logs/                            # Logs d'entraînement
├── features/                        # Features extraites
│
├── rice_quality_solution.py         # Solution principale
├── ensemble_strategy.py             # Stratégie d'ensemble
├── WINNING_STRATEGY.md              # Guide complet
├── config.yaml                      # Configuration
├── setup.sh                         # Installation
├── train.sh                         # Lancer entraînement
├── predict.sh                       # Lancer prédiction
└── README.md                        # Ce fichier
```

---

## 🚀 Installation Rapide

### Option 1: Script Automatique (Recommandé)

```bash
# Rendre le script exécutable
chmod +x setup.sh

# Lancer l'installation
./setup.sh
```

### Option 2: Installation Manuelle

```bash
# Créer environnement virtuel
python3 -m venv venv
source venv/bin/activate

# Installer PyTorch (avec CUDA)
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118

# Installer les dépendances
pip install numpy pandas scikit-learn scipy
pip install opencv-python pillow albumentations timm
pip install tqdm matplotlib seaborn

# Créer la structure de dossiers
mkdir -p images/{paddy,brown,white} models outputs logs features
```

---

## 📥 Téléchargement des Données

### Méthode 1: gsutil (Recommandé pour gros volumes)

```bash
# Installer gsutil
pip install gsutil

# Télécharger toutes les images
gsutil -m cp -r gs://unido-afririce/* ./images/

# Vérifier
ls -lh images/paddy/ images/brown/ images/white/
```

### Méthode 2: Téléchargement manuel

1. Visiter: https://storage.googleapis.com/unido-afririce/
2. Télécharger les dossiers paddy/, brown/, white/
3. Placer dans le dossier `images/`

### Données CSV

Télécharger depuis la page Zindi:
- Train.csv
- Test.csv
- SampleSubmission.csv

---

## 🎓 Entraînement

### Entraînement de Base

```bash
# Activer l'environnement
source venv/bin/activate

# Lancer l'entraînement
python rice_quality_solution.py
```

### Entraînement Complet (Ensemble)

```bash
# Pipeline complet avec ensemble
./run_all.sh
```

### Options d'Entraînement

Modifier `config.yaml` pour personnaliser:

```yaml
training:
  image_size: 768        # Taille des images (plus grand = meilleur mais plus lent)
  batch_size: 8          # Taille du batch (ajuster selon GPU)
  num_epochs: 50         # Nombre d'époques
  num_folds: 5           # Nombre de folds pour cross-validation
  learning_rate: 0.0001  # Taux d'apprentissage
```

---

## 🔮 Prédiction et Soumission

### Générer une Soumission

```bash
# Prédire sur le test set
python predict.py

# Vérifier le fichier de soumission
head outputs/submission.csv
```

### Format de Soumission

```csv
ID,Count,Broken_Count,Long_Count,Medium_Count,Black_Count,Chalky_Count,Red_Count,Yellow_Count,Green_Count,WK_Length_Average,WK_Width_Average,WK_LW_Ratio_Average,Average_L,Average_a,Average_b
sample_001,1250.5,125.3,850.2,275.0,12.5,45.8,8.2,15.3,3.1,6.85,2.15,3.19,75.2,-2.5,18.3
...
```

---

## 📊 Stratégies pour Améliorer le Score

### 1. Architecture de Modèle (Impact: +0.02-0.04)

#### Modèles Recommandés
- **EfficientNet B4/B5**: Excellent équilibre performance/vitesse
- **ConvNeXT**: Architecture moderne, très performante
- **Vision Transformer (ViT)**: Capture les dépendances longues
- **Swin Transformer**: Excellent pour la vision

```python
# Exemple: Utiliser EfficientNet-B5
model = timm.create_model('efficientnet_b5', pretrained=True)
```

### 2. Augmentation de Données (Impact: +0.01-0.02)

```python
# Augmentations recommandées
transforms = A.Compose([
    A.HorizontalFlip(p=0.5),
    A.VerticalFlip(p=0.5),
    A.RandomRotate90(p=0.5),
    A.ShiftScaleRotate(p=0.5),
    A.RandomBrightnessContrast(p=0.5),
    A.HueSaturationValue(p=0.5),
])
```

### 3. Test-Time Augmentation (TTA) (Impact: +0.01-0.02)

```python
# Prédire avec plusieurs transformations
predictions = []
for transform in [original, h_flip, v_flip, rotate90]:
    pred = model(transform(image))
    predictions.append(pred)

final_pred = np.mean(predictions, axis=0)
```

### 4. Ensemble de Modèles (Impact: +0.02-0.03)

```python
# Combiner plusieurs modèles
models = [
    efficientnet_b5,
    convnext_base,
    vit_base,
]

predictions = []
for model in models:
    pred = model(image)
    predictions.append(pred)

final_pred = np.mean(predictions, axis=0)
```

### 5. Feature Engineering (Impact: +0.01-0.02)

Extraire des features traditionnelles:
- Histogrammes de couleur
- Statistiques de texture (GLCM)
- Comptage de contours
- Dimensions des grains

### 6. Post-Processing (Impact: +0.005-0.01)

```python
# Clipper dans des plages réalistes
for i, col in enumerate(TARGET_COLS):
    min_val = train[col].quantile(0.01)
    max_val = train[col].quantile(0.99)
    predictions[:, i] = np.clip(predictions[:, i], min_val, max_val)

# Appliquer contraintes logiques
# Ex: Count >= Broken_Count + Long_Count + Medium_Count
```

---

## 💡 Conseils d'Experts

### 🎯 Pour Atteindre le Top 3

1. **Commencer simple, itérer rapidement**
   - Baseline: EfficientNet-B4 → Score ~0.88
   - + Augmentations → Score ~0.89
   - + Ensemble → Score ~0.91
   - + TTA + Post-processing → Score ~0.93+

2. **Valider chaque amélioration**
   - Utiliser K-Fold (5-10 folds)
   - Ne pas se fier qu'au score public
   - Vérifier la stabilité des prédictions

3. **Optimiser l'infrastructure**
   - Utiliser mixed precision training
   - Gradient accumulation si GPU limité
   - Paralléliser l'extraction de features

4. **Surveiller l'overfitting**
   - Early stopping (patience ≥ 10)
   - Dropout (0.2-0.3)
   - Weight decay (1e-5)

### ⚠️ Pièges à Éviter

- ❌ Ne pas normaliser les targets
- ❌ Oublier de fixer les seeds
- ❌ Utiliser trop d'augmentations (peut nuire)
- ❌ Négliger le post-processing
- ❌ Se fier uniquement au score public

---

## 📈 Roadmap vers le Top 3

### Semaine 1: Baseline
- [ ] Configuration environnement
- [ ] Exploration des données
- [ ] Baseline EfficientNet-B4
- [ ] Score cible: 0.87-0.88

### Semaine 2: Optimisations
- [ ] Feature engineering
- [ ] Augmentations avancées
- [ ] Cross-validation 5-fold
- [ ] Score cible: 0.89-0.90

### Semaine 3: Ensemble
- [ ] Entraîner 3-5 modèles
- [ ] Test-Time Augmentation
- [ ] Optimiser les poids
- [ ] Score cible: 0.91-0.92

### Semaine 4: Fine-tuning
- [ ] Pseudo-labeling
- [ ] Post-processing avancé
- [ ] Soumissions finales
- [ ] Score cible: 0.93-0.94+

---

## 🐛 Dépannage

### Problème: CUDA Out of Memory

```bash
# Réduire la taille du batch
# Dans config.yaml:
batch_size: 4  # au lieu de 8

# Ou utiliser gradient accumulation
accumulation_steps: 4
```

### Problème: Entraînement trop lent

```bash
# Utiliser mixed precision
use_amp: true

# Réduire la taille d'image
image_size: 384  # au lieu de 768

# Utiliser un modèle plus petit
backbone: "efficientnet_b3"  # au lieu de b5
```

### Problème: Score trop bas

1. Vérifier les données:
   ```python
   print(train[TARGET_COLS].describe())
   print(train[TARGET_COLS].isnull().sum())
   ```

2. Vérifier les prédictions:
   ```python
   print(predictions.min(), predictions.max())
   print(np.any(np.isnan(predictions)))
   ```

3. Comparer avec baseline:
   ```python
   baseline = train[TARGET_COLS].mean()
   mae = np.abs(predictions - test_targets).mean()
   ```

---

## 📚 Ressources Supplémentaires

### Documentation Officielle
- [Zindi Challenge Page](https://zindi.africa/competitions/unido-afririce-rice-quality-assessment-challenge)
- [UNIDO Website](https://www.unido.org/)
- [AfricaRice Website](https://www.africarice.org/)

### Tutoriels et Guides
- [WINNING_STRATEGY.md](WINNING_STRATEGY.md) - Guide complet pour Top 3
- [PyTorch Image Models (timm)](https://github.com/rwightman/pytorch-image-models)
- [Albumentations Docs](https://albumentations.ai/)

### Articles de Référence
- EfficientNet: https://arxiv.org/abs/1905.11946
- Vision Transformer: https://arxiv.org/abs/2010.11929
- Test-Time Augmentation: https://arxiv.org/abs/1912.11370

---

## 🤝 Contribution

Ce projet est pour le Rice Quality Assessment Challenge. Si vous avez des suggestions ou trouvez des bugs:

1. Ouvrir une issue
2. Proposer une pull request
3. Partager sur les forums Zindi

---

## 📝 Licence

Ce code est fourni à des fins éducatives pour le challenge UNIDO AfricaRice.

---

## 🙏 Remerciements

- **UNIDO** pour l'organisation du challenge
- **AfricaRice** pour les données et l'expertise
- **Zindi** pour la plateforme
- La communauté Zindi pour le partage de connaissances

---

## 📞 Contact

Pour toute question:
- Forums Zindi: https://zindi.africa/competitions/unido-afririce-rice-quality-assessment-challenge/discussions
- Discord Zindi
- Twitter: #ZindiChallenge

---

**Bonne chance à tous les participants! 🍀**

**Objectif**: Top 3 avec un score > 0.93 MAE! 🏆
