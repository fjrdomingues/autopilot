#!/bin/bash

# Initialize the Git repository if it doesn't exist
if [ ! -d .git ]; then
  git init
  git remote add origin https://github.com/fjrdomingues/autopilot.git
fi

# Stash the .heroku folder
git add .heroku
git stash

# Fetch the latest code from the remote repository
git fetch origin main

# Reset the working directory to the latest commit
git reset --hard FETCH_HEAD

# Apply the stashed changes (the .heroku folder)
git stash apply

# Remove the stash if the apply was successful
if [ $? -eq 0 ]; then
  git stash drop
fi
