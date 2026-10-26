---
name: expo-docs
description: Check the Expo docs for the installed SDK before writing Expo, EAS, or React Native code in the Orbis mobile app. Use before writing or changing any code that touches an Expo, EAS, or React Native API.
---

# Expo Docs

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed, so never write against them from memory.

## Workflow

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`.
3. For anything else, fetch https://docs.expo.dev/llms.txt, an index of all Expo docs with corrections to common misconceptions, and follow its links to the specific page you need.
