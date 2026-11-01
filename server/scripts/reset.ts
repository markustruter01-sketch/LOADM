import { resetDemoData } from "../services/demo-service";
import { pool } from "../db";

resetDemoData("manual")
  .then((r) => {
    console.log(JSON.stringify(r.summary, null, 2));
    return pool.end();
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
