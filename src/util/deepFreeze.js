module.exports = function deepFreeze(object) {
  if (object === null || typeof object !== "object") return object;

  if (Array.isArray(object)) return Object.freeze(object.map(deepFreeze));

  let newFreezingObject = {};
  for (const [key, value] of Object.entries(object))
    newFreezingObject[key] = deepFreeze(value);

  return Object.freeze(newFreezingObject);
};
