const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const root = join(__dirname, '..', '..');
const settingsSource = readFileSync(
  join(root, 'store', 'modules', 'settings.js'),
  'utf8',
);
const rulePopupSource = readFileSync(
  join(root, 'components', 'popup-model', 'rule-popup.vue'),
  'utf8',
);

assert.match(settingsSource, /ruleContent:\s*['"`]{2}/);
assert.match(settingsSource, /ruleContent:\s*\(state\)\s*=>\s*state\.ruleContent/);
assert.match(settingsSource, /setRuleContent\(state,\s*ruleContent\)/);
assert.match(settingsSource, /commit\('setRuleContent',\s*data\.game\.ruleContent\s*\|\|\s*''\)/);
assert.match(settingsSource, /commit\('setRuleContent',\s*data\.ruleContent\s*\|\|\s*''\)/);

assert.match(rulePopupSource, /ruleContent\(\)/);
assert.match(rulePopupSource, /this\.\$store\.getters\.ruleContent\s*\|\|\s*this\.\$t\('rule'\)/);
assert.match(rulePopupSource, /v-html="ruleContent"/);
