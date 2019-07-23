let commander = require('commander');
let fs = require('fs');
let pkg = require('./package.json');

console.log(process.argv);

commander
  .version(pkg.version)
  .option('-i, --ignore-case', 'Perform case insensitive match')
  .option('-m, --multi-line', 'Perform multi-line matches')
  .option('-v, --verbose', 'Verbose operation')
  .option('--edit', 'Send to editor')
  .usage('[options] <pattern> <file|path> [<file|path> ...]')
  .parse(process.argv);

if (commander.args.length < 2) {
  commander.help();
}

let regopts = 
  (commander.ignoreCase ? 'i' : '') +
  (commander.multiLine ? 'm' : '') + 
  'g';
let regex = new RegExp(commander.args.shift(), regopts);
if (commander.verbose) console.log('Regexp:', regex);

commander.args.forEach((arg) => scanArg(arg));

function scanArg(arg) {
  try {
    if (fs.statSync(arg).isDirectory()) {
      let entries = fs.readdirSync(arg);
      entries.forEach((entry) => scanArg(`${arg}/${entry}`));
    } else {
      scanFile(arg);
    }
  } catch (e) {
    console.log(e.message);
  }
}

function scanFile(arg) {
  let data = fs.readFileSync(arg, 'utf-8');
  // if (commander.edit)
  for (
    let match = regex.exec(data);
    match;
    match = regex.exec(data)
  ) {
    printMatch(arg, match);
  }
}

function printMatch(arg, match) {
  let preLines = 1;
  let preIndex = 0;
  let index = match.input.indexOf('\n');
  while (index !== -1 && index < match.index) {
    preLines++;
    preIndex = index + 1;
    index = match.input.indexOf('\n', preIndex);
  }
  let preMatch = match.input.substring(preIndex, match.index);
  if (preMatch.length > 50) {
    preMatch = ` ... ${preMatch.slice(-50)}`;
  }
  index = match.input.indexOf('\n', match.index + match[0].length);
  if (index === -1) index = match.input.length;
  let postMatch = match.input.substring(match.index + match[0].length, index);
  if (postMatch.length > 150) {
    postMatch = `${postMatch.slice(0, 150)} ...`;
  }
  console.log(`${arg}:${preLines}:${preMatch}${match[0]}${postMatch}`);
}

function printMatch2(arg, match) {
  let preMatch = match.input.substr(0, match.index);
  let i = preMatch.lastIndexOf('\n');
  let preMatchLine = i !== -1 ? preMatch.substr(i+1) : preMatch;
  let postMatch = match.input.substr(match.index + match[0].length);
  i = postMatch.indexOf('\n');
  let postMatchLine = i !== -1 ? postMatch.substr(0, i) : postMatch;
  let preNrLines = nrLines(preMatch);
  console.log(`${arg}:${preNrLines+1}:${preMatchLine}${match[0]}${postMatchLine}`);
}

function nrLines(arg) {
  let count = 0;
  for (
    let index = arg.indexOf('\n');
    index !== -1;
    index = arg.indexOf('\n', index + 1)
  ) {
    count++;
  }
  return count;
}