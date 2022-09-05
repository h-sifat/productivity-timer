export interface CurrentTimeMs {
  (): number;
}

export interface IsValidUnixMsTimestamp {
  (timestamp: number): timestamp is number;
}
