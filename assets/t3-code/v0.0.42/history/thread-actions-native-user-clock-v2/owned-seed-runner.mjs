import{spawn,spawnSync}from'node:child_process';import{cp,mkdir,mkdtemp,readFile,writeFile}from'node:fs/promises';import{resolve}from'node:path';import{createHash}from'node:crypto';
const root=process.cwd(),directory=resolve(root,'.work/full-parity-audit/settle-actions-native');
const component=process.argv[2],theme=process.argv[3],policy=process.argv[4];
if(!['settle-thread','thread-actions'].includes(component)||!['dark','light'].includes(theme)||!['original','user-clock'].includes(policy))throw Error('Pass component theme original|user-clock');
const run=await mkdtemp(resolve(directory,`${component}-${theme}-${policy}-`)),seed=resolve(root,component==='thread-actions'?'.work/t3-v0042-pin-fixture':'.work/t3-v0042-composer-fixture'),db=resolve(seed,'userdata/state.sqlite'),backend=resolve(run,'backend'),database=resolve(backend,'userdata/state.sqlite'),hash=b=>createHash('sha256').update(b).digest('hex');
const originalSha=hash(await readFile(db));await cp(seed,backend,{recursive:true,filter:path=>![db,db+'-wal',db+'-shm'].includes(path)});const backup=spawnSync('sqlite3',['-readonly',db,`.backup '${database.replaceAll("'","''")}'`],{encoding:'utf8'});if(backup.status)throw Error(backup.stderr);await cp(database,resolve(run,'readonly-seed-before.sqlite'));
if(component==='thread-actions'){
 const precondition=spawnSync('python3',['-c',`import sqlite3,json,sys
c=sqlite3.connect(sys.argv[1]);names={'Build a logo intro','Catalog motion audit','Grouped logo tests','Review final hold','Search reveal timing'}
rows=c.execute('SELECT thread_id,title,settled_override FROM projection_threads WHERE archived_at IS NULL AND deleted_at IS NULL').fetchall()
assert len(rows)==6 and {r[1] for r in rows if r[2] is None}==names and [(r[1],r[2]) for r in rows if r[2] is not None]==[('Verify Logo Enter parity','settled')]
before={t[0]:c.execute('SELECT * FROM '+t[0]).fetchall() for t in c.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()}
delta=[]
for identifier,title,state in rows:
 if title in names:
  c.execute("UPDATE projection_threads SET settled_override='active' WHERE thread_id=? AND settled_override IS NULL",(identifier,));delta.append({'threadId':identifier,'title':title,'column':'settled_override','before':None,'after':'active'})
c.commit()
after={t:c.execute('SELECT * FROM '+t).fetchall() for t in before}
columns=[r[1] for r in c.execute('PRAGMA table_info(projection_threads)')];index=columns.index('settled_override');idindex=columns.index('thread_id');allowed={r['threadId'] for r in delta}
for table,old in before.items():
 new=after[table];assert len(old)==len(new)
 if table!='projection_threads':assert old==new;continue
 byid={r[idindex]:r for r in new}
 for r in old:
  n=list(byid[r[idindex]])
  if r[idindex] in allowed:assert n[index]=='active' and r[index] is None;n[index]=None
  assert tuple(n)==r
print(json.dumps(delta))`,database],{encoding:'utf8'});
 if(precondition.status)throw Error(precondition.stderr);await writeFile(resolve(run,'owned-active-overrides.json'),precondition.stdout);
}
const rows=spawnSync('sqlite3',['-readonly',database,'-json','SELECT title,settled_override FROM projection_threads WHERE archived_at IS NULL AND deleted_at IS NULL ORDER BY title;'],{encoding:'utf8'});if(rows.status)throw Error(rows.stderr);const threads=JSON.parse(rows.stdout);if(threads.length!==6||threads.filter(t=>t.settled_override==='active').length!==5||threads.filter(t=>t.title==='Verify Logo Enter parity'&&t.settled_override==='settled').length!==1)throw Error('Expected five active/one settled native seed');
await writeFile(resolve(run,'seed.json'),JSON.stringify({sourceDatabaseSha256:originalSha,backupSha256:hash(await readFile(database)),threads,mutation:component==='thread-actions'?'Only five identified active overrides NULL→active; all other table rows/columns verified unchanged':'none'},null,2)+'\n');await mkdir(resolve(run,'source'));
if(process.argv[5]==='--prepare'){if(hash(await readFile(db))!==originalSha)throw Error('Original source database changed');console.log('CPU seed prepared',run);process.exit(0);}
const backendStartedAt=Date.now();const port=Number(process.env.T3_PROBE_PORT??4171);const server=spawn(resolve(root,'.work/t3-v0042-bin/t3-0.0.42-linux-x64/t3'),['serve','--mode','desktop','--base-dir',backend,'--port',String(port),'--host','127.0.0.1','--no-browser'],{cwd:root,stdio:['ignore','pipe','pipe']});let logs='';for(const stream of [server.stdout,server.stderr])stream.on('data',data=>logs+=data);let child;
try{
 for(let i=0;i<120&&!logs.includes('Pairing URL: ');i++){if(server.exitCode!==null)throw Error('Native backend exited');await new Promise(done=>setTimeout(done,250));}if(!logs.includes('Pairing URL: '))throw Error('No pairing URL');await writeFile(resolve(run,'backend.log'),logs);
 const driver=resolve(directory,process.env.T3_PROBE_CAPTURE_DRIVER??component+'-capture.mjs');console.log('Native owned run',run);await new Promise((done,reject)=>{child=spawn(process.execPath,[driver,theme],{cwd:root,env:{...process.env,T3_CAPTURE_RUN:run,T3_CAPTURE_POLICY:policy,T3_BACKEND_STARTED_AT:String(backendStartedAt)},stdio:'inherit'});child.on('error',reject);child.on('close',code=>code===0?done():reject(Error('Native capture failed '+code)));});
}finally{if(child?.exitCode===null)child.kill('SIGTERM');server.kill('SIGTERM');await new Promise(done=>server.exitCode!==null?done():server.once('close',done));const after=hash(await readFile(db));await writeFile(resolve(run,'source-database-after.json'),JSON.stringify({before:originalSha,after,unchanged:after===originalSha})+'\n');if(after!==originalSha)throw Error('Original source database changed');}
