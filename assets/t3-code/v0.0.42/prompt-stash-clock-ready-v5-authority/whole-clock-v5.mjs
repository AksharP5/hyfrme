import{normalizeSidebarSerialization}from'./sidebar-guard-v5.mjs';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {afterClockHook,sample} from './timer-policy.mjs';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const fixedDate='2026-09-25T11:30:00Z';
export async function capture({page,work,source,originalSource,prefix,theme,prompt,fps,frames,events,editor,badge,drawer,stashEntries,save,clean}){
 const cdp=await page.context().newCDPSession(page);
 const samples=[],boundaries=[],epochs=[],phaseGuards=[],bootstraps=[];
 let epoch,totalMilliseconds,settlingMilliseconds,previousVideoMilliseconds,expectedIds,actualIds,firstStashId;
 const stashIds=new Map(),reverseStashIds=new Map();
 const normalizeIds=(html,ids)=>html.replace(/_r_[^_]+_/g,id=>{if(!ids.has(id))ids.set(id,`_r_${ids.size}_`);return ids.get(id);});
 const phaseGuard=async phase=>{
  const root=clean(await page.locator('#root').evaluate(el=>el.innerHTML));
  const expectedRoot=await readFile(resolve(originalSource,`${prefix}-${phase}.html`),'utf8');
  let expected=normalizeIds(expectedRoot,expectedIds),actual=normalizeIds(root,actualIds);
  const metrics=await page.evaluate(()=>Array.from(document.querySelectorAll('li')).filter(el=>el.matches('[data-thread-item="true"]')||['sidebar-pinned-header','sidebar-pinned-divider','sidebar-settled-header'].includes(el.dataset.testid)).map(el=>{const s=getComputedStyle(el);return{tag:el.outerHTML.split('>')[0]+'>',className:el.className,style:el.getAttribute('style'),rect:el.getBoundingClientRect().toJSON(),duration:s.transitionDuration,delay:s.transitionDelay,transform:s.transform,animations:el.getAnimations().length};}));
  await writeFile(resolve(source,`guard-${epoch.id}-${phase}-raw-root.html`),root);
  await writeFile(resolve(source,`guard-${epoch.id}-${phase}-live-sidebar.json`),JSON.stringify(metrics,null,2));
  const sidebar=normalizeSidebarSerialization(expected,actual,metrics);
  expected=sidebar.expected;
  const {deltas,inert}=sidebar;
  await writeFile(resolve(source,`guard-${epoch.id}-${phase}-raw-root.html`),root);
  await writeFile(resolve(source,`guard-${epoch.id}-${phase}-root-result.json`),JSON.stringify({rootExactUnderOnlyIdsAndKnownInertTags:expected===actual,expectedRawRootSha256:hash(expectedRoot),actualRawRootSha256:hash(root),deltas,inert,knownInertExceptionApplied:deltas.length>0},null,2));
  if(expected!==actual){await writeFile(resolve(source,`guard-${epoch.id}-${phase}-expected.html`),expected);await writeFile(resolve(source,`guard-${epoch.id}-${phase}-actual.html`),actual);throw Error('Native root graph/input drift at '+phase);}
  const portalVisible=await drawer.isVisible().catch(()=>false);
  let portalSha256=null;
  if(portalVisible){
   const portal=clean(await page.locator('[data-composer-drawer-layer="true"]').evaluate(el=>el.outerHTML));
   const expectedPortal=await readFile(resolve(originalSource,`${prefix}-${phase}-portal.html`),'utf8');
   await writeFile(resolve(source,`guard-${epoch.id}-${phase}-raw-portal.html`),portal);
   const attribute=/data-stash-(entry|restore)="([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})"/g;
   const expectedPairs=Array.from(expectedPortal.matchAll(attribute),match=>({kind:match[1],id:match[2],raw:match[0]}));
   const actualPairs=Array.from(portal.matchAll(attribute),match=>({kind:match[1],id:match[2],raw:match[0]}));
   const entries=await stashEntries();
   await writeFile(resolve(source,`guard-${epoch.id}-${phase}-stash-uuid-raw.json`),JSON.stringify({expectedPairs,actualPairs,persistedEntryIds:entries.map(entry=>entry.id),mapBefore:Array.from(stashIds)},null,2));
   if(expectedPairs.length!==2||actualPairs.length!==2||expectedPairs.filter(x=>x.kind==='entry').length!==1||actualPairs.filter(x=>x.kind==='entry').length!==1||expectedPairs.filter(x=>x.kind==='restore').length!==1||actualPairs.filter(x=>x.kind==='restore').length!==1||expectedPairs[0].id!==expectedPairs[1].id||actualPairs[0].id!==actualPairs[1].id||entries.length!==1||actualPairs[0].id!==entries[0].id)throw Error('Exact scoped stash UUID pair/multiplicity/persistence drift at '+phase);
   const expectedId=expectedPairs[0].id,actualId=actualPairs[0].id;
   if((stashIds.has(expectedId)&&stashIds.get(expectedId)!==actualId)||(reverseStashIds.has(actualId)&&reverseStashIds.get(actualId)!==expectedId))throw Error('Stash UUID bijection changed across actual reload');
   stashIds.set(expectedId,actualId);reverseStashIds.set(actualId,expectedId);
   const mappedExpected=expectedPortal.replace(attribute,(tag,kind,id)=>'data-stash-'+kind+'="'+stashIds.get(id)+'"');
   await writeFile(resolve(source,`guard-${epoch.id}-${phase}-stash-uuid.json`),JSON.stringify({expectedPairs,actualPairs,map:Array.from(stashIds),persistedEntryId:entries[0].id},null,2));
   const portalExact=normalizeIds(mappedExpected,expectedIds)===normalizeIds(portal,actualIds);
   await writeFile(resolve(source,`guard-${epoch.id}-${phase}-portal-result.json`),JSON.stringify({portalExactUnderOnlyIdsAndScopedStashPair:portalExact,rawPortalSha256:hash(portal),expectedRawPortalSha256:hash(expectedPortal)},null,2));
   if(!portalExact)throw Error('Native portal graph/input drift at '+phase);
   portalSha256=hash(portal);
  }
  phaseGuards.push({epoch:epoch.id,phase,rawRootSha256:hash(root),expectedRawRootSha256:hash(expectedRoot),portalSha256,bijectiveGraphExact:true,deltas,inert});
 };
 const startEpoch=async(frame,bootstrap)=>{
  await cdp.send('Animation.enable');await cdp.send('Animation.setPlaybackRate',{playbackRate:0});
  await page.clock.pauseAt(new Date(fixedDate));await page.clock.runFor(0);
  const ticks=await page.evaluate(()=>performance.now());await page.clock.runFor(Math.ceil(ticks/16)*16-ticks);
  await page.evaluate(afterClockHook);
  epoch={id:epochs.length,firstVideoFrame:frame,videoOriginMilliseconds:Math.ceil(frame*1000/fps),clockStart:await page.evaluate(()=>performance.now()),bootstrap,samplesStart:samples.length};
  epochs.push(epoch);totalMilliseconds=0;settlingMilliseconds=0;previousVideoMilliseconds=epoch.videoOriginMilliseconds;expectedIds=new Map();actualIds=new Map();
 };
 const record=async label=>{
  const state=await sample(page,totalMilliseconds);
  if(state.dateNow!==Date.parse(fixedDate))throw Error('Fixed Date changed');
  if(Math.abs(state.performanceNow-epoch.clockStart-totalMilliseconds)>0.001)throw Error('Source clock epoch drift');
  const latest=state.trace.filter(x=>x.kind==='scheduled').at(-1);
  if(state.badge&&latest){
   const expired=state.trace.some(x=>x.kind==='callback'&&x.id===latest.id);
   if(!state.count||state.count.class.includes('text-primary')===expired||state.count.class.includes('text-muted-foreground')!==expired)throw Error('Count class not derived from authentic source callback');
   const expanded=state.badge.expanded==='true';
   if(state.badge.class.split(/\s+/).includes('text-foreground')!==(!expired||expanded))throw Error('Native badge expanded/pulse semantic changed');
  }
  return{label,epoch:epoch.id,videoOriginMilliseconds:epoch.videoOriginMilliseconds,settlingMilliseconds,...state};
 };
 const advance=async(ticks,label)=>{
  const trace=await page.evaluate(()=>window.__stashTrace);
  const points=trace.filter(x=>x.kind==='scheduled').flatMap(x=>[1199,1200,1201].map(offset=>x.performanceNow-epoch.clockStart+offset)).filter(t=>t>totalMilliseconds&&t<=totalMilliseconds+ticks).sort((a,b)=>a-b);
  const target=totalMilliseconds+ticks;
  for(const point of [...new Set(points)]){await page.clock.runFor(point-totalMilliseconds);totalMilliseconds=point;boundaries.push(await record(label+'-callback-boundary'));}
  await page.clock.runFor(target-totalMilliseconds);totalMilliseconds=target;
 };
 const settle=async(milliseconds,label)=>{await advance(milliseconds,label);settlingMilliseconds+=milliseconds;};
 const saveGuard=async phase=>{await save(phase);await phaseGuard(phase);};
 try{
  const initialReadiness=JSON.parse(await readFile(resolve(source,'initial-toast-readiness.json'),'utf8'));
  if(!initialReadiness.allDetached||initialReadiness.exitingCount!==0)throw Error('Initial toast readiness incomplete');
  await startEpoch(0,initialReadiness);await phaseGuard('draft');
  for(let frame=0;frame<frames;frame++){
   const videoMilliseconds=Math.ceil(frame*1000/fps);
   await advance(videoMilliseconds-previousVideoMilliseconds,'frame-'+frame);previousVideoMilliseconds=videoMilliseconds;
   if(frame===events.stash){
    await page.keyboard.press('Control+s');await page.waitForFunction(()=>document.querySelector('[data-testid="composer-editor"]')?.textContent?.trim()==='');await badge.waitFor();
    samples.push({frame,action:'stash',beforeSettle:await record('before350')});await settle(350,'original-stash350');await saveGuard('stashed');
    const entries=await stashEntries();if(entries.length!==1||entries[0].prompt!==prompt||!/^\b[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(entries[0].id))throw Error('Native stash did not preserve prompt/UUIDv4');firstStashId=entries[0].id;
   }
   if(frame===events.menu){
    await badge.click();await drawer.waitFor();await page.mouse.move(800,60);
    samples.push({frame,action:'menu',beforeSettle:await record('before200')});await settle(200,'original-menu200');await saveGuard('menu');
   }
   if(frame===events.persistedMenu){
    epoch.outgoing=await record('before-reload');
    await cdp.send('Animation.setPlaybackRate',{playbackRate:1});await page.clock.resume();
    await page.clock.setFixedTime(new Date(fixedDate));
    const bootstrapHostStart=process.hrtime.bigint();
    await page.reload({waitUntil:'domcontentloaded'});
    await editor.waitFor({timeout:20000});await badge.waitFor({timeout:5000});
    await page.locator('button[data-slot="toast-close"]').evaluateAll(buttons=>{window.__wholeDismissedToasts=buttons.map(button=>button.closest('[data-position]'));if(window.__wholeDismissedToasts.some(node=>!node))throw Error('Reload toast root absent');buttons.forEach(button=>button.click());});
    await page.evaluate(()=>document.fonts.ready);
    await page.waitForFunction(()=>window.__wholeDismissedToasts.every(node=>!node.isConnected)&&document.querySelectorAll('[data-slot="toast-viewport"] [data-ending-style]').length===0,undefined,{timeout:3000});
    const bootstrap=await page.evaluate(()=>({performanceNow:performance.now(),dateNow:Date.now(),allDetached:window.__wholeDismissedToasts.every(node=>!node.isConnected),dismissedCount:window.__wholeDismissedToasts.length,exitingCount:document.querySelectorAll('[data-slot="toast-viewport"] [data-ending-style]').length,countClass:document.querySelector('[data-prompt-stash-badge] [data-slot="composer-banner-actions"] span')?.className,tracePresent:typeof window.__stashTrace!=='undefined',animationMapPresent:typeof window.__stashAnimations!=='undefined',editorText:document.querySelector('[data-testid="composer-editor"]')?.textContent,theme:document.documentElement.className.includes('dark')?'dark':'light'}));
    bootstrap.hostBootstrapMilliseconds=Number(process.hrtime.bigint()-bootstrapHostStart)/1e6;
    bootstrap.persistedEntries=await stashEntries();
    if(bootstrap.dateNow!==Date.parse(fixedDate)||bootstrap.theme!==theme||bootstrap.tracePresent||bootstrap.animationMapPresent||!bootstrap.countClass?.includes('text-muted-foreground')||bootstrap.countClass.includes('animate-')||bootstrap.editorText.trim()!==''||bootstrap.persistedEntries.length!==1||bootstrap.persistedEntries[0].prompt!==prompt||bootstrap.persistedEntries[0].id!==firstStashId)throw Error('Reload document/clock/persistence precondition drift: '+JSON.stringify(bootstrap));
    bootstraps.push(bootstrap);
    await startEpoch(frame,bootstrap);
    await badge.click();await drawer.waitFor();await page.mouse.move(800,60);
    samples.push({frame,action:'persisted-menu',beforeSettle:await record('before250')});await settle(250,'original-persisted-menu250');await saveGuard('persisted-menu');
   }
   if(frame===events.recall){
    await page.locator('[data-stash-restore]').first().click();await page.waitForFunction(value=>document.querySelector('[data-testid="composer-editor"]')?.textContent?.includes(value),prompt);await editor.evaluate(el=>el.blur());await page.mouse.move(800,60);
    samples.push({frame,action:'recall',beforeSettle:await record('before250')});await settle(250,'original-recall250');await saveGuard('recalled');
    if((await stashEntries()).length!==0||(await editor.innerText()).trim()!==prompt||await drawer.isVisible()||await page.locator('[data-stash-entry],[data-stash-restore]').count())throw Error('Native recall state drift; original stash ID not consumed');
   }
   if(frame===events.stashAgain){
    await page.keyboard.press('Control+s');await page.waitForFunction(()=>document.querySelector('[data-testid="composer-editor"]')?.textContent?.trim()==='');await badge.waitFor();await page.mouse.move(800,60);
    samples.push({frame,action:'stash-again',beforeSettle:await record('before250')});await settle(250,'original-stash-again250');await saveGuard('direct-stashed');
    const secondEntries=await stashEntries();if(secondEntries.length!==1||secondEntries[0].id===firstStashId||!/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/.test(secondEntries[0].id))throw Error('Second native stash state/UUID identity drift');
   }
   if(frame===events.directRecall){
    await page.keyboard.press('Control+s');await page.waitForFunction(value=>document.querySelector('[data-testid="composer-editor"]')?.textContent?.includes(value),prompt);await editor.evaluate(el=>el.blur());await page.mouse.move(800,60);
    samples.push({frame,action:'direct-recall',beforeSettle:await record('before250')});await settle(250,'original-direct-recall250');await saveGuard('direct-recalled');
    if((await stashEntries()).length!==0||(await editor.innerText()).trim()!==prompt||await drawer.isVisible()||await page.locator('[data-stash-entry],[data-stash-restore]').count())throw Error('Direct native recall state drift; second stash ID not consumed');
   }
   samples.push({frame,phase:'sample',videoMilliseconds,state:await record('frame-'+frame)});
   await page.screenshot({path:resolve(work,'frame-'+String(frame).padStart(4,'0')+'.png')});
  }
  epoch.outgoing=await record('completed');
  if(epochs.length!==2||epochs[0].outgoing.trace.filter(x=>x.kind==='scheduled').length!==1||epochs[0].outgoing.trace.filter(x=>x.kind==='callback').length!==1||epochs[1].outgoing.trace.filter(x=>x.kind==='scheduled').length!==1)throw Error('Authentic per-document timer lifecycle differs');
  for(const e of epochs)for(const callback of e.outgoing.trace.filter(x=>x.kind==='callback')){const schedule=e.outgoing.trace.find(x=>x.kind==='scheduled'&&x.id===callback.id);if(!schedule||callback.performanceNow-schedule.performanceNow!==1200)throw Error('Real callback1200 violated');}
 }finally{
  await writeFile(resolve(source,'whole-clock-evidence.json'),JSON.stringify({kind:'Candidate genuine source timer/CSS clock authority, not bound',theme,fixedDate,events,originalSettlingMilliseconds:{stash:350,menu:200,persistedMenu:250,recall:250,stashAgain:250,directRecall:250},epochs,bootstraps,samples,boundaries,phaseGuards,stashIdMap:Array.from(stashIds)},null,2));
  await cdp.detach();
 }
}
