The live index.html is an encrypted maintenance/preview page.

Edit `_preview/index.html` for the wedding page, or `_preview/lock.html` for the maintenance screen. Then rebuild from PowerShell:

```powershell
Read-Host 'Preview password' | node scripts/lock-site.mjs
```

Commit the source edits and regenerated index.html together. Styling and main.js remain editable in their usual locations. Visitors enter the password each time they reload; “Lock preview” returns to the maintenance screen.

This is a casual preview lock on static hosting. The repository, its history, and image URLs can still be public. A short numeric password can be guessed offline. Do not use this to protect sensitive information; use authenticated server hosting for private access. robots.txt and noindex request search exclusion, rather than enforcing it.
