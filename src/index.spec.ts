import test from 'ava'
import doIt from './index';

test('it works?', async t => {
  t.pass();
  return doIt();
});
