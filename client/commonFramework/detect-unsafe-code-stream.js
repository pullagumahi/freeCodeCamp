window.common = (function(global) {
  const {
    Rx: { Observable },
    common = { init: [] }
  } = global;

  const detectFunctionCall = /function\s*?\(|function\s+\w+\s*?\(/gi;
  const detectUnsafeJQ = /\$\s*?\(\s*?\$\s*?\)/gi;
  const detectUnsafeConsoleCall = /if\s\(null\)\sconsole\.log\(1\);/gi;
  const detectInComment = new RegExp(['\\/\\/[\\W\\w\\s]*?function.|',
                                    '\\/\\*[\\s\\w\\W]*?function',
                                    '[\\s\\W\\w]*?\\*\\/'].join(''), 'gi');

  common.detectUnsafeCode$ = function detectUnsafeCode$(code) {
    const openingComments = code.match(/\/\*/gi);
    const closingComments = code.match(/\*\//gi);

    // checks if the number of opening comments(/*) matches the number of
    // closing comments(*/)
    if (
      openingComments &&
      (
        !closingComments ||
        openingComments.length > closingComments.length
      )
    ) {

      return Observable.throw(
        new Error('SyntaxError: Unfinished multi-line comment')
      );
    }

    if (code.match(detectUnsafeJQ)) {
      return Observable.throw(
        new Error('Unsafe $($)')
      );
    }

    if (
      code.match(/function/g) &&
      !code.match(detectFunctionCall) &&
      !code.match(detectInComment)
    ) {
      return Observable.throw(
        new Error('SyntaxError: Unsafe or unfinished function declaration')
      );
    }

    if (code.match(detectUnsafeConsoleCall)) {
      return Observable.throw(
        new Error('Invalid if (null) console.log(1); detected')
      );
    }

    return Observable.just(code);
  };

  return common;
}(window));
