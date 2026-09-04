# Qwixx · Judd Game Night

For GitHub Pages, upload both `index.html` and `qwixx.html` to the repository root, then enable Pages from the branch. The game is fully standalone and needs no server or API configuration.

To list it in the Game Night catalog, add this object to `games.config.js` and replace the placeholder URL:

```js
{
  id: "qwixx",
  title: "Qwixx",
  subtitle: "Three-handed dice game",
  path: "https://YOUR-GITHUB-USERNAME.github.io/YOUR-REPOSITORY/",
  icon: "qwixx",
  enabled: true
}
```

The game detects the `gameNight` link parameter and displays a **← Game Night** return button automatically.

To run locally with the optional Node server:

```powershell
& 'C:\Users\glide\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' qwixx-server.js
```

Then open `http://localhost:8080`.

Choose Daryl, Cristi, or Cindy. Any seat not claimed is played by a bot.
