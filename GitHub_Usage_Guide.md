# GitHub Usage Guide for Cerebro Project

This guide walks you through the basic workflow for collaborating on the Cerebro project. Follow these steps in order.

## Prerequisites
- Install Git: Download from [git-scm.com](https://git-scm.com/)
- Have a GitHub account and access to the repository

## Step 1: First Time Getting the Project
When you join the project for the first time, you need to clone (copy) the repository to your computer.

```bash
git clone https://github.com/mohamed-bouzid-cloud/cerebro.git
cd cerebro
```

This downloads all the project files to a folder called "cerebro" on your computer.

## Step 2: Getting the Latest Updates
Every time you start working or want to get the newest changes from others:

```bash
cd cerebro  # Make sure you're in the project folder
git pull origin main
```

This fetches and merges the latest changes from the remote repository.

## Step 3: If You Made Changes to the Project
After you edit files, you must push your changes so others can see them.

```bash
cd cerebro  # Make sure you're in the project folder
git add .   # Stage all your changes
git commit -m "Describe what you changed"  # Commit with a message
git push origin main  # Push to the remote repository
```

## Important Notes
- **Always pull before starting work:** Run `git pull origin main` to get the latest changes
- **Commit messages:** Write clear, descriptive messages about what you changed
- **If conflicts occur:** Contact the project maintainer for help
- **The repository was recently reset:** Your local history may differ, so pull frequently

For more Git help, visit [Git documentation](https://git-scm.com/doc).</content>
<parameter name="filePath">GitHub_Usage_Guide.md