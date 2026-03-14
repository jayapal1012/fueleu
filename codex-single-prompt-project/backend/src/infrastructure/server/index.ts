import { createApp } from "../../adapters/inbound/http/create-app.js";
import { appConfig } from "../db/config.js";

const app = createApp();

app.listen(appConfig.port, () => {
  console.log(`Backend listening on http://localhost:${appConfig.port}`);
});

