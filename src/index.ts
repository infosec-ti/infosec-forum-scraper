import { ConfigService, Env } from "./common/config/config.service";
import app from "./domain/server/server";

app.listen(ConfigService.getVar(Env.PORT), () => {
  console.log("Server is running on port", ConfigService.getVar(Env.PORT));
});
