import { deepFreeze } from "common/util/other";
import { Request } from "src/controllers/interface";
import { makeGetConfig } from "src/controllers/config/get";

const CONFIG = Object.freeze({ FIRST_DAY_OF_WEEK: "Sat", CHECK_UPDATE: true });
const validRequestObject: Request = deepFreeze({
  body: {},
  query: {},
  params: {},
  headers: {},
  method: "get",
  path: "/config",
});

const getConfig = makeGetConfig({ config: CONFIG });

it(`returns the config`, async () => {
  const response = await getConfig({ ...validRequestObject });
  expect(response).toEqual({ body: { success: true, data: CONFIG } });
});
