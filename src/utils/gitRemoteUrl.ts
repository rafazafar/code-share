import * as ini from 'ini';
import * as GitUrlParse from 'git-url-parse';
import * as vscode from 'vscode';

const gitExtension = vscode.extensions.getExtension('vscode.git').exports;
const git = gitExtension.getAPI(1);

const expandKeys = (config: any) => {
  for (let key of Object.keys(config)) {
    let m = /(\S+) "(.*)"/.exec(key);
    if (!m) continue;
    let prop = m[1];
    config[prop] = config[prop] || {};
    config[prop][m[2]] = config[key];
    delete config[key];
  }
  return config;
};

const parseIni = (str: string, options?: any) => {
  let opts = Object.assign({}, options);

  str = str.replace(/\[(\S+) "(.*)"\]/g, (m, $1, $2) => {
    return $1 && $2 ? `[${$1} "${$2.split('.').join('\\.')}"]` : m;
  });

  let config = ini.parse(str);
  if (opts?.expandKeys === true) {
    return expandKeys(config);
  }
  return config;
};

function gitRemoteUrl(content: string) {
  const config = parseIni(content);
  const url = config['remote "origin"']?.url;
  const parsedUrl = GitUrlParse(url);
  return `${parsedUrl.resource}/${parsedUrl.full_name}`;
}

function gitCurrentBranch(): string {
  const repository = git.repositories[0]; // Assuming you're working with the first repo, adjust if needed
  return repository.state.HEAD.name;
}

function isBranchPublished(branchName: string): boolean {
  const repository = git.repositories[0];
  return repository.state.refs.some(ref => ref.name === `origin/${branchName}`);
}

function gitDefaultBranch(): string {
  const repository = git.repositories[0];
  const remoteHEAD = repository.state.refs.find(ref => ref.name === 'origin/HEAD');
  return remoteHEAD?.upstream?.name || 'main'; // 'main' as a fallback
}

export default gitRemoteUrl;
export { gitCurrentBranch, isBranchPublished, gitDefaultBranch };