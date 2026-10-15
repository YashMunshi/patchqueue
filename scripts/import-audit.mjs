import {readFile,writeFile} from 'node:fs/promises';
if(process.argv.length<4)throw Error('Usage: node scripts/import-audit.mjs npm-audit.json package-lock.json [output.json]');
const audit=JSON.parse(await readFile(process.argv[2],'utf8')),lock=JSON.parse(await readFile(process.argv[3],'utf8'));
if(!audit.vulnerabilities||!lock.packages)throw Error('Expected npm audit v2 vulnerabilities and a package-lock v2/v3 packages map.');
const findings=[];let index=0;
for(const [name,v] of Object.entries(audit.vulnerabilities))for(const advisory of (v.via||[]).filter(x=>typeof x==='object'))for(const node of v.nodes||[]){const installed=lock.packages[node]?.version;if(!installed)throw Error('Installed version missing for '+node);const fixed=typeof v.fixAvailable==='object'?v.fixAvailable.version:null;findings.push({id:'import-'+(++index),app:process.env.APPLICATION_NAME||'imported-app',package:name,version:installed,advisory:String(advisory.source||advisory.url||advisory.title),severity:advisory.severity||v.severity,fixed,reachable:false,reachabilityNote:'Unknown; false is a conservative prioritization input, not an exploitability finding.'});}
const input={findings,candidates:{},postScan:null,postScanComplete:false};
await writeFile(process.argv[4]||'imported-audit.json',JSON.stringify(input,null,2));console.log('Normalized '+findings.length+' installed advisory records. Reachability has not been established.');
