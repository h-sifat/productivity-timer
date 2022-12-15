import fs, { promises as fsp } from "fs";

export interface access_Argument {
  path: string;
  permissions?: Partial<{ read: boolean; write: boolean }>;
}

const permissionToMode: { [k: string]: number } = Object.freeze({
  read: fs.constants.R_OK,
  write: fs.constants.W_OK,
});

export async function accessPath(arg: access_Argument) {
  const { path: _path, permissions } = arg;

  let mode: number = 0;
  if (permissions)
    for (const [key, value] of Object.entries(permissions))
      if (key in permissionToMode && value) mode |= permissionToMode[key];

  let exists = true,
    hasPermissions = true;

  try {
    await fsp.access(_path, mode);
  } catch (ex) {
    if (ex.code === "ENOENT") {
      exists = false;
      hasPermissions = false;
    } else if (ex.code === "EACCES") hasPermissions = false;
    else throw ex;
  }

  return { exists, hasPermissions };
}
