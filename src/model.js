export const TZ = 'Asia/Kolkata';
export const kinds = ['meals','water','exercise','sleep','weights','fasts','cravings','movements'];
export function dayKey(date = new Date()) { return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year:'numeric', month:'2-digit', day:'2-digit' }).format(date); }
export function timeKey(date = new Date()) { return new Intl.DateTimeFormat('en-GB', {timeZone:TZ,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(date); }
export function shiftDay(day, amount) { return new Date(Date.parse(day + 'T12:00:00+05:30') + amount*86400000).toISOString().slice(0,10); }
export function monthDeadline(day,months){
 const [year,month,date]=day.split('-').map(Number);const target=new Date(Date.UTC(year,month-1+months,1,12));const lastDay=new Date(Date.UTC(target.getUTCFullYear(),target.getUTCMonth()+1,0)).getUTCDate();target.setUTCDate(Math.min(date,lastDay));return target.toISOString().slice(0,10);
}
export function localStamp(day, time) { return new Date(`${day}T${time}:00+05:30`).toISOString(); }
export function emptyState() {
 return {version:1, settings:{stepGoal:8000,startWeight:110,goalWeight:90,waterGoal:2500,proteinGoal:100,startDate:dayKey(),checkpoints:[105,100,95],eatingStart:'13:00',eatingEnd:'21:00',fastingOptional:true,reminders:true,activitySource:'manual',foods:[['Rice',200,4,1],['Dal',180,10,5],['Vegetables',100,3,4],['Eggs',140,12,0],['Chicken',220,35,0],['Fish',180,28,0],['Dosa',170,4,1],['Idli',120,4,1],['Curd',100,5,0],['Salad',60,2,3],['Chicken shawarma',450,25,3]].map(([name,calories,protein,fiber])=>({name,calories,protein,fiber,portion:'1 serving (adjust to your portion)'}))}, days:{}, ...Object.fromEntries(kinds.map(k=>[k,[]])), activeFast:null, activeMovement:null};
}
export const sum = (items,key) => items.reduce((total,item)=>total+(Number(item[key])||0),0);
export function summary(state,day=dayKey()) {
 const records = Object.fromEntries(kinds.map(k=>[k,state[k].filter(r=>r.date===day)]));
 const daily=state.days[day]||{};
 const checks=[records.meals.length>0,records.water.length>0,daily.steps!==undefined,records.exercise.length>0,records.sleep.length>0,daily.sugar!==undefined,records.movements.length>0];
 return {...records, daily, calories:sum(records.meals,'calories'),protein:sum(records.meals,'protein'),fiber:sum(records.meals,'fiber'),hasFiber:records.meals.some(m=>m.fiber!==null),waterTotal:sum(records.water,'amount'),exerciseMinutes:sum(records.exercise,'minutes'),score:Math.round(checks.filter(Boolean).length/checks.length*100),completed:checks.filter(Boolean).length,habitCount:checks.length};
}
export function periodSummary(state,end=dayKey(),length=7) {
 const start=shiftDay(end,1-length); const inRange=r=>r.date>=start&&r.date<=end;
 const meals=state.meals.filter(inRange);const days=[...new Set(meals.map(m=>m.date))];
 const weights=state.weights.filter(inRange).sort((a,b)=>a.date.localeCompare(b.date));
 const daily=Object.entries(state.days).filter(([d])=>d>=start&&d<=end).map(([,d])=>d);
 const sleeps=state.sleep.filter(inRange); const exercise=state.exercise.filter(inRange);
 return {start,end,mealDays:days.length,avgCalories:days.length?sum(meals,'calories')/days.length:null,avgProtein:days.length?sum(meals,'protein')/days.length:null,walks:state.movements.filter(inRange).length,avgSteps:daily.filter(d=>d.steps!==undefined).length?sum(daily,'steps')/daily.filter(d=>d.steps!==undefined).length:null,avgSleep:sleeps.length?sum(sleeps,'minutes')/sleeps.length:null,exerciseMinutes:sum(exercise,'minutes'),strength:exercise.filter(r=>r.strength).length,fastDays:new Set(state.fasts.filter(inRange).map(f=>f.date)).size,waterDays:Array.from({length},(_,i)=>summary(state,shiftDay(start,i)).waterTotal>=state.settings.waterGoal).filter(Boolean).length,weightChange:weights.length>=2?weights.at(-1).kg-weights[0].kg:null};
}
function assert(ok,message){if(!ok)throw new Error(message);}
const numeric=(n,min,max)=>typeof n==='number'&&Number.isFinite(n)&&n>=min&&n<=max;
export function validDate(s){return typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s+'T12:00:00+05:30'))&&dayKey(new Date(s+'T12:00:00+05:30'))===s;}
export function validateState(s) {
 assert(s&&s.version===1&&s.settings&&s.days,'This is not a supported Steadily backup.');
 assert(Object.keys(s).every(k=>['version','settings','days','activeFast','activeMovement',...kinds].includes(k)),'Unsupported backup fields.');
 const cfg=s.settings;
 for(const key of ['startWeight','goalWeight'])assert(numeric(cfg[key],20,500),'Weight goals must be between 20 and 500 kg.');
 assert(numeric(cfg.waterGoal,250,10000)&&numeric(cfg.proteinGoal,1,500),'Invalid water or protein goal.');
 assert(validDate(cfg.startDate),'Invalid starting date.');
 if(cfg.stepGoal!==undefined)assert(numeric(cfg.stepGoal,1,100000)&&Number.isInteger(cfg.stepGoal),'Step goal must be a whole number from 1 to 100,000.');
 assert(Array.isArray(cfg.checkpoints)&&cfg.checkpoints.length===3&&cfg.checkpoints.every(n=>numeric(n,20,500)),'Invalid checkpoints.');
 for(const k of ['eatingStart','eatingEnd'])assert(/^([01]\d|2[0-3]):[0-5]\d$/.test(cfg[k]),'Invalid eating window.');
 for(const k of ['fastingOptional','reminders'])assert(typeof cfg[k]==='boolean','Invalid preferences.');
 assert(cfg.activitySource==='manual','Only manual activity entry is supported.');
 assert(Array.isArray(cfg.foods)&&cfg.foods.length<=100,'Invalid quick foods.');
 const string=(v,max=2000)=>typeof v==='string'&&v.length<=max;
 for(const f of cfg.foods)assert(string(f.name,100)&&string(f.portion,200)&&numeric(f.calories,0,10000)&&numeric(f.protein,0,1000)&&numeric(f.fiber,0,500),'Invalid quick food.');
 const ids=new Set();
 for(const kind of kinds){
  assert(Array.isArray(s[kind])&&s[kind].length<=50000,'Invalid record collection.');
  for(const r of s[kind]){
   assert(r&&string(r.id,100)&&/^[a-zA-Z0-9_-]+$/.test(r.id)&&!ids.has(r.id)&&validDate(r.date),'Invalid or duplicate record.');ids.add(r.id);
   for(const k of ['name','note','description','portion','type'])if(r[k]!==undefined)assert(string(r[k]),'Text is too long.');
   if(r.time!==undefined)assert(/^([01]\d|2[0-3]):[0-5]\d$/.test(r.time),'Invalid time.');
   if(kind==='meals'){assert(string(r.name,100)&&numeric(r.calories,0,10000)&&numeric(r.protein,0,1000)&&(r.fiber===null||numeric(r.fiber,0,500)),'Invalid meal nutrition.');assert(typeof r.favorite==='boolean','Invalid favorite.');if(r.photo)assert(typeof r.photo==='string'&&/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(r.photo)&&r.photo.length<=2000000,'Invalid photo attachment.');}
   if(kind==='water')assert(numeric(r.amount,1,5000),'Water must be 1–5,000 ml.');
   if(kind==='weights')assert(numeric(r.kg,20,500)&&(r.waist===null||numeric(r.waist,20,300)),'Invalid body measurement.');
   if(kind==='exercise'||kind==='movements')assert(numeric(r.minutes,1,1440),'Invalid movement duration.');
   if(kind==='exercise')assert(typeof r.strength==='boolean','Invalid strength flag.');
   if(kind==='sleep'){
    assert(numeric(r.minutes,1,1440)&&['','poor','fair','good','excellent'].includes(r.quality),'Invalid sleep.');
    if(r.stages!==undefined){
     assert(r.stages&&typeof r.stages==='object'&&!Array.isArray(r.stages),'Invalid sleep stages.');
     assert(Object.keys(r.stages).every(k=>Object.hasOwn(sleepStageNames,k)),'Unknown sleep stage.');
     for(const value of Object.values(r.stages))assert(numeric(value,0,1440)&&Number.isInteger(value),'Sleep stage minutes must be whole numbers from 0 to 1,440.');
     assert(['rem','core','deep'].reduce((n,k)=>n+(r.stages[k]??0),0)<=r.minutes,'REM, Core, and Deep together cannot exceed total sleep duration.');
     assert(r.minutes+(r.stages.awake??0)<=1440,'Sleep plus Awake time cannot exceed 24 hours.');
    }
   }
   if(kind==='cravings')assert(numeric(r.intensity,1,5)&&typeof r.unplanned==='boolean','Invalid craving.');
   if(kind==='fasts'&&r.plannedMinutes!==undefined&&r.plannedMinutes!==null)assert(numeric(r.plannedMinutes,1,1440),'Invalid planned fasting duration.');
   if(kind==='fasts')assert(Number.isFinite(Date.parse(r.start))&&Number.isFinite(Date.parse(r.end))&&Date.parse(r.end)>Date.parse(r.start)&&dayKey(new Date(r.end))===r.date,'Invalid fasting interval.');
  }
 }
 assert(typeof s.days==='object'&&!Array.isArray(s.days),'Invalid daily logs.');
 for(const [day,d] of Object.entries(s.days)){assert(validDate(day)&&d&&typeof d==='object','Invalid daily date.');if(d.steps!==undefined)assert(numeric(d.steps,0,100000)&&Number.isInteger(d.steps),'Steps must be a whole number.');if(d.sugar!==undefined)assert(typeof d.sugar==='boolean','Invalid sugar awareness.');for(const k of ['energy','hunger'])if(d[k]!==undefined)assert(numeric(d[k],1,5),'Invalid rating.');for(const k of ['sugarNote','intention','reflection'])if(d[k]!==undefined)assert(string(d[k]),'Invalid daily note.');}
 if(s.activeFast!==null)assert(s.activeFast&&Number.isFinite(Date.parse(s.activeFast.start))&&Date.parse(s.activeFast.start)<=Date.now(),'Invalid active fast.');
 if(s.activeFast?.plannedMinutes!==undefined&&s.activeFast.plannedMinutes!==null)assert(numeric(s.activeFast.plannedMinutes,1,1440),'Invalid planned fasting duration.');
 if(s.activeMovement!==null)assert(s.activeMovement&&Number.isFinite(Date.parse(s.activeMovement.start))&&numeric(s.activeMovement.minutes,1,1440)&&string(s.activeMovement.type),'Invalid active movement.');
 return s;
}
export function parseBackup(text){assert(text.length<100000000,'Backup exceeds the 100 MB import limit.');const state=JSON.parse(text);validateState(state);return state;}
export function elapsedMinutes(start,end=new Date().toISOString()){return Math.max(0,(Date.parse(end)-Date.parse(start))/60000);}
export function weightChange(state,days,end=dayKey()){
 const sorted=state.weights.filter(w=>w.date<=end).sort((a,b)=>a.date.localeCompare(b.date));const latest=sorted.at(-1);const baseline=sorted.filter(w=>w.date<=shiftDay(end,-days)).at(-1);return latest&&baseline?latest.kg-baseline.kg:null;
}

// Optional additions to v1: old records and backups remain valid without these fields.
export function dailyStepGoal(settings) { return settings.stepGoal ?? 8000; }
export function stepProgress(state, date = dayKey()) {
 const steps = state.days[date]?.steps;
 const goal = dailyStepGoal(state.settings);
 return {steps, goal, percent:steps===undefined?0:Math.min(100,steps/goal*100),remaining:steps===undefined?null:Math.max(0,goal-steps)};
}
export function fastingPlanMinutes(settings) {
 const minutes = time => { const [h,m]=time.split(':').map(Number); return h*60+m; };
 const planned=(minutes(settings.eatingStart)-minutes(settings.eatingEnd)+1440)%1440;
 return planned || null;
}
export function fastingProgress(state, now = new Date()) {
 const active=state.activeFast;
 const stamp=now instanceof Date?now.toISOString():now;
 const target=active&&Object.hasOwn(active,'plannedMinutes')?active.plannedMinutes:(state.settings.fastingOptional?fastingPlanMinutes(state.settings):null);
 const elapsed=active?elapsedMinutes(active.start,stamp):0;
 return {active:!!active,elapsed,target,percent:active&&target?Math.min(100,elapsed/target*100):0,reached:!!active&&target!==null&&elapsed>=target,remaining:active&&target?Math.max(0,target-elapsed):null};
}
export const sleepStageNames={rem:'REM',core:'Core',deep:'Deep',awake:'Awake'};
export function sleepStageSummary(record) {
 if(!record?.stages || !Object.keys(record.stages).length)return null;
 const entries=Object.entries(sleepStageNames).filter(([key])=>Object.hasOwn(record.stages,key)).map(([key,name])=>({key,name,minutes:record.stages[key]}));
 const total=record.minutes+(record.stages.awake??0);
 const logged=entries.reduce((n,entry)=>n+entry.minutes,0);
 return {entries,total,logged,unentered:Math.max(0,total-logged)};
}
