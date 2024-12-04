import * as express from "express";
import * as fs from "fs/promises";
import {
  AppState,
  IncorrectPayload,
  isAppState,
  isSettings,
  isStoreName,
  NoSuchStore,
  ServerError,
  Settings,
  StoreName,
} from "../src/types";

const BACKEND_STORE_DIRECTORY = "backend-state";

async function writeToStorage(object: AppState | Settings): Promise<void> {
  switch (object.kind) {
    case "AppState": {
      await fs.writeFile(
        `${BACKEND_STORE_DIRECTORY}/state.json`,
        JSON.stringify(object)
      );
      return;
    }
    case "Settings": {
      await fs.writeFile(
        `${BACKEND_STORE_DIRECTORY}/settings.json`,
        JSON.stringify(object)
      );
      return;
    }
  }
}

async function readFromStorage(
  storeName: StoreName
): Promise<Settings | AppState | ServerError> {
  switch (storeName) {
    case "AppState": {
      try {
        const data = JSON.parse(
          (await fs.readFile(`${BACKEND_STORE_DIRECTORY}/state.json`)).toString(
            "utf-8"
          )
        ) as unknown;

        if (isAppState(data)) {
          return data;
        }
        return IncorrectPayload();
      } catch (error) {
        return NoSuchStore();
      }
    }
    case "Settings": {
      try {
        const data: unknown = JSON.parse(
          (
            await fs.readFile(`${BACKEND_STORE_DIRECTORY}/settings.json`)
          ).toString("utf-8")
        ) as unknown;
        if (isSettings(data)) {
          return data;
        }
        return IncorrectPayload();
      } catch (error) {
        return NoSuchStore();
      }
    }
  }
}

async function loadEndpoint(
  req: express.Request,
  res: express.Response
): Promise<void> {
  const storeName = req.params.storeName;

  console.log(`/load/${storeName}`);

  if (!isStoreName(storeName)) {
    res.statusCode = 404;
    res.json(NoSuchStore());
    return;
  }

  const data = await readFromStorage(storeName);
  res.statusCode = 200;
  res.json(data);
}

async function saveEndpoint(
  req: express.Request,
  res: express.Response
): Promise<void> {
  const storeName = req.params.storeName;
  const data = req.body;

  console.log(`/save/${storeName}`);

  if (!isStoreName(storeName)) {
    res.statusCode = 404;
    res.json(NoSuchStore());
    return;
  }

  switch (storeName) {
    case "Settings": {
      if (!isSettings(data)) {
        res.statusCode = 503;
        res.json(IncorrectPayload());
        return;
      }
      await writeToStorage(data);

      res.statusCode = 200;
      res.send("ok");
      return;
    }
    case "AppState": {
      if (!isAppState(data)) {
        res.statusCode = 503;
        res.json(IncorrectPayload());
        return;
      }
      await writeToStorage(data);

      res.statusCode = 200;
      res.send("ok");
      return;
    }
  }
}

async function main() {
  // make backend stores directory if it doesn't exist
  try {
    await fs.mkdir(BACKEND_STORE_DIRECTORY);
  } catch (error) {}

  const PORT = 8013;
  const app = express.default();
  app.use(express.static("./web"));

  app.use(express.json());

  app.get("/healthcheck", (req, res) => {
    res.status(200);
    res.send("ok");
  });

  app.get("/load/:storeName", loadEndpoint);
  app.post("/save/:storeName", saveEndpoint);

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

main();
