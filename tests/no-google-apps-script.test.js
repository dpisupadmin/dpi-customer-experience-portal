import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const runtimeRoots = ['index.html','js','api','lib'];
const forbidden = [
  /script\.google\.com/i,
  /google\.script\.run/i,
  /HtmlService/i,
  /SpreadsheetApp/i,
  /PropertiesService/i,
  /MailApp/i,
  /DriveApp/i,
  /SlidesApp/i
];

function collectRuntimeFiles(){
  const out = [];
  for(const rel of runtimeRoots){
    const target = path.join(root, rel);
    if(!fs.existsSync(target)) continue;
    const stat = fs.statSync(target);
    if(stat.isFile()){ out.push(target); continue; }
    const stack = [target];
    while(stack.length){
      const dir = stack.pop();
      for(const entry of fs.readdirSync(dir, {withFileTypes:true})){
        const full = path.join(dir, entry.name);
        if(entry.isDirectory()) stack.push(full);
        else if(/\.(html|js|json|css)$/i.test(entry.name)) out.push(full);
      }
    }
  }
  return out;
}

test('runtime package contains no Google Apps Script dependency', () => {
  const violations = [];
  for(const file of collectRuntimeFiles()){
    if(file.endsWith('no-google-apps-script.test.js')) continue;
    const content = fs.readFileSync(file, 'utf8');
    for(const rx of forbidden){
      if(rx.test(content)) violations.push(path.relative(root, file) + ' => ' + rx);
    }
  }
  assert.deepEqual(violations, []);
});
