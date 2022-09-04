export {};

interface CustomMatchers<R = unknown> {
  toThrowErrorWithCode(code: string): R;
}

declare global {
  namespace jest {
    interface Expect extends CustomMatchers {}
    interface Matchers<R> extends CustomMatchers<R> {}
    interface InverseAsymmetricMatchers extends CustomMatchers {}
  }
}

expect.extend({
  toThrowErrorWithCode(received, expectedErrorCode) {
    let didThrow = false;
    let error: any;

    try {
      received();
      didThrow = true;
    } catch (ex) {
      error = ex;
    }

    let pass = false;
    let message: string;

    if (didThrow)
      message = `Expected: Function to throw\nReceived: Function did not throw`;
    else if (!(error instanceof Error)) {
      message = `Expected: Error to be an instance of the "Error" class\n`;
      message +=
        typeof error === "object" && error
          ? `Received: An instance of "${
              error.constructor.name || "Unknown"
            }" class`
          : `Received: "${error}"`;
    } else if ((<any>error).code !== expectedErrorCode)
      message = `Expected: Error code to be "${expectedErrorCode}"\nReceived: Error code "${
        (<any>error).code
      }"`;
    else pass = true;

    if (pass)
      return {
        message: () =>
          `Expected: Error code not to be "${expectedErrorCode}"\nReceived: Error code "${error.code}"`,
        pass: true,
      };

    return {
      message: () => message,
      pass: false,
    };
  },
});
