# Guide d'utilisation de GitHub pour le projet Cerebro

Ce guide vous explique le workflow de base pour collaborer sur le projet Cerebro. Suivez ces étapes dans l'ordre.

## Prérequis
- Installez Git : Téléchargez depuis [git-scm.com](https://git-scm.com/)
- Ayez un compte GitHub et accès au dépôt

## Étape 1 : Première fois que vous obtenez le projet
Lorsque vous rejoignez le projet pour la première fois, vous devez cloner (copier) le dépôt sur votre ordinateur.

```bash
git clone https://github.com/mohamed-bouzid-cloud/cerebro.git
cd cerebro
```

Cela télécharge tous les fichiers du projet dans un dossier appelé "cerebro" sur votre ordinateur.

## Étape 2 : Obtenir les dernières mises à jour
Chaque fois que vous commencez à travailler ou voulez obtenir les dernières modifications des autres :

```bash
# Assurez-vous d'être dans le dossier du projet
git pull origin main
```

Cela récupère et fusionne les dernières modifications du dépôt distant.

## Étape 3 : Si vous avez apporté des modifications au projet
Après avoir modifié des fichiers, vous devez pousser vos modifications pour que les autres puissent les voir.

```bash
# Assurez-vous d'être dans le dossier du projet
git add .   # Préparer toutes vos modifications
git commit -m "Décrivez ce que vous avez changé"  # Commiter avec un message
git push origin main  # Pousser vers le dépôt distant
```

## Notes importantes
- **Toujours tirer avant de commencer le travail :** Exécutez `git pull origin main` pour obtenir les dernières modifications
- **Messages de commit :** Écrivez des messages clairs et descriptifs sur ce que vous avez changé
- **En cas de conflits :** Contactez le mainteneur du projet pour obtenir de l'aide
- **Le dépôt a été récemment réinitialisé :** Votre historique local peut différer, tirez fréquemment

Pour plus d'aide sur Git, visitez [Documentation Git](https://git-scm.com/doc).