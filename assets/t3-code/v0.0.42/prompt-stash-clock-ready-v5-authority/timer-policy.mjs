export const afterClockHook = `(() => {
  window.__stashTrace=[];
  const realSetTimeout=window.setTimeout;
  window.setTimeout=function(callback,delay,...args){
    if(Number(delay)!==1200)return realSetTimeout.call(window,callback,delay,...args);
    const id=window.__stashTrace.filter(x=>x.kind==='scheduled').length;
    window.__stashTrace.push({kind:'scheduled',id,delay:Number(delay),performanceNow:performance.now(),dateNow:Date.now(),callbackSource:String(callback),stack:new Error().stack});
    return realSetTimeout.call(window,function(...values){window.__stashTrace.push({kind:'callback',id,performanceNow:performance.now(),dateNow:Date.now()});return callback(...values);},delay,...args);
  };
  new MutationObserver(mutations=>{for(const mutation of mutations){const el=mutation.target;if(el.nodeType!==1||!(el.matches('[data-prompt-stash-badge]')||el.closest('[data-prompt-stash-badge]')))continue;window.__stashTrace.push({kind:'class-mutation',tag:el.tagName,class:el.className,attribute:mutation.attributeName,performanceNow:performance.now(),dateNow:Date.now()});}}).observe(document,{subtree:true,attributes:true,attributeFilter:['class','aria-expanded']});
  window.__stashAnimations=new WeakMap();
})();`;
export async function sample(page,totalMilliseconds){return page.evaluate(async({totalMilliseconds})=>{
 const badge=document.querySelector('[data-prompt-stash-badge]');if(badge)getComputedStyle(badge).color;
 const animations=[];
 for(const animation of document.getAnimations()){
  let start=window.__stashAnimations.get(animation);
  if(start===undefined){start=totalMilliseconds;window.__stashAnimations.set(animation,start);}
  animation.pause();animation.currentTime=totalMilliseconds-start;await animation.ready;
  const timing=animation.effect.getTiming();if(animation.currentTime>=animation.effect.getComputedTiming().endTime)animation.finish();
  animations.push({type:animation.constructor.name,property:animation.transitionProperty||null,name:animation.animationName||null,sourceFirstSeenMilliseconds:start,currentTime:animation.currentTime,timing,keyframes:animation.effect.getKeyframes(),target:{tag:animation.effect.target.tagName,class:animation.effect.target.className}});
 }
 const count=badge?.querySelector('[data-slot="composer-banner-actions"] span');
 return{totalMilliseconds,performanceNow:performance.now(),dateNow:Date.now(),badge:badge?{class:badge.className,color:getComputedStyle(badge).color,expanded:badge.getAttribute('aria-expanded')}:null,count:count?{class:count.className,color:getComputedStyle(count).color,opacity:getComputedStyle(count).opacity,transform:getComputedStyle(count).transform}:null,animations,trace:window.__stashTrace};
},{totalMilliseconds});}
