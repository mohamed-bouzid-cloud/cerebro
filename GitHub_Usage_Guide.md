# GitHub Usage Guide for Cerebro Project

This guide provides the essential Git commands for collaborating on the Cerebro project. Since the repository has been reset, follow these steps to get started and stay updated.

## Prerequisites
- Install Git: Download from [git-scm.com](https://git-scm.com/)
- Have a GitHub account and access to the repository

## 1. First Clone (Initial Setup)
To clone the repository for the first time:

```bash
git clone https://github.com/mohamed-bouzid-cloud/cerebro.git
cd cerebro
```

This downloads the entire project to your local machine.

## 2. First Update (Pull Latest Changes)
After cloning, or to get the latest changes:

```bash
git pull origin main
```

This fetches and merges the latest changes from the remote repository.

## 3. Second Clone (If Needed)
If you need a second copy of the repository (e.g., for testing or backup):

```bash
git clone https://github.com/mohamed-bouzid-cloud/cerebro.git cerebro-second
cd cerebro-second
```

## 4. Update for Second Clone
To update the second clone:

```bash
cd cerebro-second
git pull origin main
```

## 5. Third Clone (If Needed)
For a third copy:

```bash
git clone https://github.com/mohamed-bouzid-cloud/cerebro.git cerebro-third
cd cerebro-third
```

## 6. Update for Third Clone
To update the third clone:

```bash
cd cerebro-third
git pull origin main
```

## General Workflow
- **Before starting work:** Always run `git pull origin main` to get the latest changes
- **After making changes:** 
  ```bash
  git add .
  git commit -m "Your commit message"
  git push origin main
  ```
- **If you encounter conflicts:** Contact the project maintainer for resolution

## Important Notes
- The repository was recently force-pushed, so your local history may differ from remote
- If you have uncommitted changes, stash them before pulling: `git stash`
- After pulling, restore stashed changes: `git stash pop`

For more advanced Git commands, refer to the [Git documentation](https://git-scm.com/doc).</content>
<parameter name="filePath">GitHub_Usage_Guide.md