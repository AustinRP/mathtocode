import * as tfjs from '@tensorflow/tfjs'

var EQUAL = 'equal'
var NOT_EQUAL = 'not_equal'

onmessage = e => {
  var code = e.data[0];
  var params = e.data[1];
  var assertions = e.data[2];
  var res = testCode(code, params, assertions[0]);
  postMessage(res)
}

const testCode = (code, params, assertion) => {
  const {type: assert, args, expected} = assertion

  // Imported TensorFlow isn't available for some reason with out aliasing
  var tf = tfjs;

  // Parameters and arguments
  var paramsStr = params.join(', ')
  var tensors = args.map(arg => { return tf.tensor(arg) })

  // Add 'return' to single-line code
  var codeLn = code.match(/[^\r\n]+/g).length === 1 ? `return ${code}` : code;

  // Create executable function
  var fn = eval(`(${paramsStr}, tf) => { ${codeLn}; }`)

  // Run function
  var res = fn.apply(null, [...tensors, tf])

  if (res.constructor.name !== 'Tensor') {
    throw 'Result must be tf.tensor'
  }

  // Determine if all elements equal expected value
  var els = res.dataSync().length
  var truths = res.equal(expected).sum().dataSync()[0]

  switch (assert) {
    case EQUAL:
      return els === truths
    case NOT_EQUAL:
      return els !== truths
  }

  return null
}
