interface OtherInfo {
  name: string;
  maxLength?: number;
  minLength?: number;
  typeErrorCode?: string;
  maxLengthErrorCode?: string;
  minLengthErrorCode?: string;
  trimBeforeLengthValidation?: boolean;
}

export type AssertValidString = (
  string: any,
  otherInfo: OtherInfo
) => asserts string is string;
