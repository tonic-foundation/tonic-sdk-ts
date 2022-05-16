import assert from 'assert';
import { isTonicError, TonicError } from '../src';

describe('errors', () => {
  it('parses error messages', () => {
    const valid = 'E01: valid';
    const invalid = 'G01: invalid';

    const error = TonicError.from(valid);
    assert(isTonicError(error), 'error was not tonic error');
    if (isTonicError(error)) {
      assert.equal(error.code, 'E01', 'wrong error code');
      assert.equal(error.message, 'valid', 'wrong error message');
    }

    assert(
      !isTonicError(TonicError.from(invalid)),
      "shouldn't have been a tonic error"
    );
  });
});
