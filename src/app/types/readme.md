Types voor de Helios.js backend (Helios.js moet draaien op http://localhost:3000)
npm run types

Dit genereert generated/HeliosJs.ts uit http://localhost:3000/swagger.yaml. Helios.ts koppelt de Pegasus namen
(HeliosLid, HeliosLedenDataset, ...) aan de schema's uit HeliosJs.ts.

Oude PHP types (alleen nog voor Login, DDWV en Gasten, die hebben nog geen schema in Helios.js)
npx openapi-typescript  ../../../../Helios/Helios.git/docs/Startlijst.yml --output Startlijst.ts
