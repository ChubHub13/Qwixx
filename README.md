# Qwixx live table

This is the server-hosted Qwixx version. It must be deployed as a Render **Web Service** (not GitHub Pages), because it keeps the shared dice, player seats, and all visible scorecards synchronized.

Render settings:

- Build command: leave blank
- Start command: `npm start`
- Environment: Node

Keep `ui-v4.js` beside `server.js`; it provides the Qwixx table interface. After deployment, use the service URL plus `/#` in the Game Night Qwixx entry. The hash keeps Game Night's return information out of the server request:

`path: "https://YOUR-QWIXX-SERVICE.onrender.com/#"`

The service keeps the current table only while its Render instance is running. Starting a new game resets the table while retaining the selected two- or three-community-die setting.

## All-time score board

`score-history.json` holds the completed-game scores used by the High Scores and Low Scores tabs. It is created and updated automatically.

Render's normal service filesystem is replaced when the service is deployed. To retain the all-time board across deploys, attach a Render Persistent Disk at `/var/data`. This code automatically uses that location when it exists. You can instead choose another disk mount path and add this environment variable:

`SCORE_HISTORY_FILE=/var/data/qwixx-score-history.json`

Without a Persistent Disk, the board still works while the current Render instance stays up, but a deploy or instance replacement starts its history again. Render Persistent Disks require a paid web-service plan.
