interface OtherInfo {
  name: string;
  maxLength?: number;
  minLength?: number;
  typeErrorCode?: string;
  minLengthErrorCode?: string;
  maxLengthErrorCode?: string;
}

export type AssertValidString = (
  string: unknown,
  otherInfo: OtherInfo
) => asserts string is string;
