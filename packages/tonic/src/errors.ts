export const MESSAGE_CHECK_RE = /^E\d\d:/;
export const MESSAGE_PARTS_RE = /(?<code>E\d\d): *(?<message>.*$)/;

export type MaybeTonicError = TonicError | Error;

export function isTonicError(e: MaybeTonicError): e is TonicError {
  return '_isTonicError' in e;
}

export function isTonicErrorMessage(s: string) {
  return !!s.match(MESSAGE_CHECK_RE);
}

function splitOnce(s: string, d: string): [string, string] {
  const loc = s.indexOf(d);
  return [s.slice(0, loc), s.slice(loc + 1)];
}

export class TonicError extends Error {
  private readonly _isTonicError = true;

  constructor(readonly code: string, message: string) {
    super(message);
  }

  static from(raw: string): MaybeTonicError {
    if (isTonicErrorMessage(raw)) {
      const [code, message] = splitOnce(raw, ':');
      return new TonicError(code, message.trim());
    }
    return new Error(raw);
  }
}