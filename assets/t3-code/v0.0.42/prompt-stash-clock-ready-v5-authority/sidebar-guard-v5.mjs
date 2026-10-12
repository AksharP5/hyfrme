const headerClass='list-none pointer-events-none relative mx-0.5 -mb-px h-0';
const rowClass='list-none py-0.5 [content-visibility:auto] [contain-intrinsic-size:auto_78px]';
const settledClass='list-none mx-0.5 h-8 mt-auto';
const attribute=(tag,name)=>tag.match(new RegExp('(?:^| )'+name+'="([^"]*)"'))?.[1]??null;
function identity(tag){
 const testId=attribute(tag,'data-testid'),className=attribute(tag,'class');
 if(testId==='sidebar-pinned-header'&&className===headerClass)return'pinned-header';
 if(testId==='sidebar-pinned-divider'&&className===headerClass)return'pinned-divider';
 if(attribute(tag,'data-thread-item')==='true'&&className===rowClass)return'row';
 if(testId==='sidebar-settled-header'&&className===settledClass)return'settled-header';
 return null;
}
const withoutStyle=tag=>tag.replace(/ style="[^"]*"/,'');
const allowedStyle=style=>style===null||style===''||style==='transition: transform linear;';
export function normalizeSidebarSerialization(expected,actual,metrics){
 const tags=html=>Array.from(html.matchAll(/<li\b[^>]*>/g),match=>match[0]).filter(tag=>identity(tag)!==null);
 const expectedTags=tags(expected),actualTags=tags(actual);
 const expectedKinds=['pinned-header','pinned-divider','row','row','row','row','row','settled-header'];
 if(expectedTags.length!==8||actualTags.length!==8||expectedTags.some((tag,index)=>identity(tag)!==expectedKinds[index])||actualTags.some((tag,index)=>identity(tag)!==expectedKinds[index]))throw Error('Exact eight sidebar serialization identities/multiplicity changed');
 const deltas=[];
 for(let index=0;index<8;index++){
  const before=expectedTags[index],after=actualTags[index];
  if(withoutStyle(before)!==withoutStyle(after)||!allowedStyle(attribute(before,'style'))||!allowedStyle(attribute(after,'style')))throw Error('Sidebar tag differs beyond its exact inert style serialization');
  if(before!==after)deltas.push({index,identity:expectedKinds[index],expected:before,actual:after});
 }
 if(deltas.length){
  if(metrics.length!==8||metrics.some((node,index)=>identity(node.tag)!==expectedKinds[index]||withoutStyle(node.tag)!==withoutStyle(actualTags[index])||node.duration!=='0s'||node.delay!=='0s'||node.transform!=='none'||node.animations!==0))throw Error('Eight live sidebar styles are not measured inert with exact identities');
  for(const delta of deltas)expected=expected.replace(delta.expected,delta.actual);
 }
 return{expected,deltas,inert:metrics};
}
