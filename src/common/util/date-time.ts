import {
  CurrentTimeMs,
  IsValidUnixMsTimestamp,
} from "common/interfaces/date-time";
import { is } from "handy-types";

export const currentTimeMs: CurrentTimeMs = function _currentTimeMs() {
  return Date.now();
};

export const isValidUnixMsTimestamp: IsValidUnixMsTimestamp =
  function _isValidUnixMsTimestamp(timestamp) {
    return is<number>("non_negative_integer", timestamp);
  };
