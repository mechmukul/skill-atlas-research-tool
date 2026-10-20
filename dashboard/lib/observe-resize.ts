/** Defer layout writes until the next frame, outside ResizeObserver delivery. */
export function observeResize(element:Element,update:()=>void,options?:ResizeObserverOptions){
 let frame:number|undefined;
 const observer=new ResizeObserver(()=>{if(frame!==undefined)return;frame=requestAnimationFrame(()=>{frame=undefined;update();});});
 observer.observe(element,options);
 return ()=>{observer.disconnect();if(frame!==undefined)cancelAnimationFrame(frame);};
}
