# Qwixx live table

This is the server-hosted Qwixx version. It must be deployed as a Render **Web Service** (not GitHub Pages), because it keeps the shared dice, player seats, and all visible scorecards synchronized.

Render settings:

- Build command: leave blank
- Start command: `npm start`
- Environment: Node

After deployment, use the service URL plus `/#` in the Game Night Qwixx entry. The hash keeps Game Night's return information out of the server request:

`path: "https://YOUR-QWIXX-SERVICE.onrender.com/#"`

The service keeps the current table only while its Render instance is running. Starting a new game resets the table while retaining the selected two- or three-community-die setting.
