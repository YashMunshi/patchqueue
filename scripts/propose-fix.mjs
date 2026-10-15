import {readFile,writeFile,mkdtemp,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import path from 'node:path';import {execFileSync} from 'node:child_process';
const args=process.argv.slice(2),value=name=>args[args.indexOf(name)+1];
if(!args.includes('--repo-dir')||!args.includes('--package')||!args.includes('--version'))throw Error('Usage: node scripts/propose-fix.mjs --repo-dir /path/to/test-repo --package package-name --version 1.2.3 [--apply] [--publish]');
const dir=path.resolve(value('--repo-dir')),name=value('--package'),version=value('--version');
if(!/^(?:@[a-z0-9_.-]+\/)?[a-z0-9_.-]+$/i.test(name)||!/^\d+\.\d+\.\d+$/.test(version))throw Error('Use a valid package name and exact stable version.');
const filename=path.join(dir,'package.json'),pkg=JSON.parse(await readFile(filename,'utf8')),section=['dependencies','devDependencies'].find(k=>Object.hasOwn(pkg[k]||{},name));if(!section)throw Error('Package must be a direct dependency in the target repository.');
console.log(JSON.stringify({repository:dir,package:name,before:pkg[section][name],proposed:version,apply:args.includes('--apply'),publish:args.includes('--publish')},null,2));
if(!args.includes('--apply')){if(args.includes('--publish'))throw Error('--publish requires --apply.');process.exit(0);}
const git=(...a)=>execFileSync('git',a,{cwd:dir,encoding:'utf8'}).trim();if(git('status','--porcelain'))throw Error('Target working tree must be clean.');const original=git('branch','--show-current');if(!original)throw Error('Use an attached local branch.');
const branch='patchqueue/'+name.replace(/[^a-z0-9-]/gi,'-')+'-'+version+'-'+Date.now();git('switch','-c',branch);pkg[section][name]=version;await writeFile(filename,JSON.stringify(pkg,null,2)+'\n');
execFileSync('npm',['install','--package-lock-only','--ignore-scripts'],{cwd:dir,stdio:'inherit'});
let scan;try{scan=execFileSync('npm',['audit','--json','--ignore-scripts'],{cwd:dir,encoding:'utf8'});}catch(e){if(typeof e.stdout!=='string'&&!Buffer.isBuffer(e.stdout))throw e;scan=e.stdout.toString();}
const audit=JSON.parse(scan);if(!audit.metadata?.vulnerabilities)throw Error('No valid audit result was returned. Review the local branch before publishing.');
git('add','package.json','package-lock.json');git('commit','-m','Propose '+name+' '+version+' and refresh lockfile');
if(args.includes('--publish')){git('push','-u','origin',branch);const temp=await mkdtemp(path.join(tmpdir(),'patchqueue-'));try{const body=path.join(temp,'body.md');await writeFile(body,'Proposes '+name+' '+version+'.\n\nValidation: npm install --package-lock-only --ignore-scripts; npm audit --json.\n\nRemaining scanner totals:\n```json\n'+JSON.stringify(audit.metadata.vulnerabilities,null,2)+'\n```\n\nA reviewer must validate compatibility and whether the target advisory is resolved.');execFileSync('gh',['pr','create','--title','Update '+name+' to '+version,'--body-file',body],{cwd:dir,stdio:'inherit'});}finally{await rm(temp,{recursive:true,force:true});}}
console.log('Created local proposal branch '+branch+'. Original branch: '+original+'. Changes are not automatically merged.');
