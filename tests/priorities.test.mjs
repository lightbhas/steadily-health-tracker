import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyState,validateState,parseBackup,dailyStepGoal,stepProgress,fastingPlanMinutes,fastingProgress,sleepStageSummary} from '../src/model.js';
const date='2026-10-12';
const sleep=()=>({id:'sleep-record',date,minutes:450,quality:'good',note:'Existing note',source:'manual'});
test('old v1 backups remain unchanged and valid without the new optional fields',()=>{
 const old=emptyState();delete old.settings.stepGoal;old.sleep=[sleep()];old.activeFast={start:'2026-10-11T15:30:00Z'};
 const text=JSON.stringify(old);const restored=parseBackup(text);assert.equal(JSON.stringify(restored),text);assert.equal(dailyStepGoal(restored.settings),8000);assert.equal(restored.sleep[0].stages,undefined);assert.equal(sleepStageSummary(restored.sleep[0]),null);
});
test('steps distinguish an unlogged day, a logged zero, partial progress, and a reached goal',()=>{
 const s=emptyState();s.settings.stepGoal=6000;assert.equal(stepProgress(s,date).steps,undefined);assert.equal(stepProgress(s,date).remaining,null);
 s.days[date]={steps:0};assert.equal(stepProgress(s,date).steps,0);assert.equal(stepProgress(s,date).remaining,6000);
 s.days[date].steps=3000;assert.equal(stepProgress(s,date).percent,50);assert.equal(stepProgress(s,date).remaining,3000);
 s.days[date].steps=7500;assert.equal(stepProgress(s,date).percent,100);assert.equal(stepProgress(s,date).remaining,0);
 assert.equal(stepProgress(s,'2026-10-11').steps,undefined);
});
test('step goal accepts valid edits and rejects zero, fractions, nonnumbers and extreme values',()=>{
 for(const goal of [1,6000,100000]){const s=emptyState();s.settings.stepGoal=goal;validateState(s);}
 for(const goal of [0,-1,2.5,100001,'6000',null]){const s=emptyState();s.settings.stepGoal=goal;assert.throws(()=>validateState(s));}
});
test('fast plan uses the saved eating schedule, including midnight and minute offsets',()=>{
 const s=emptyState();assert.equal(s.settings.eatingStart,'13:00');assert.equal(s.settings.eatingEnd,'21:00');assert.equal(fastingPlanMinutes(s.settings),960);
 s.settings.eatingStart='21:30';s.settings.eatingEnd='05:00';assert.equal(fastingPlanMinutes(s.settings),990);
 s.settings.eatingStart='05:00';assert.equal(fastingPlanMinutes(s.settings),null);
});
test('live fasting progress crosses midnight, caps at the plan, and marks the exact threshold',()=>{
 const s=emptyState();s.activeFast={start:'2026-10-11T15:30:00Z',plannedMinutes:960};
 let p=fastingProgress(s,'2026-10-11T23:30:00Z');assert.equal(p.elapsed,480);assert.equal(p.percent,50);assert.equal(p.remaining,480);assert.equal(p.reached,false);
 p=fastingProgress(s,'2026-10-12T07:30:00Z');assert.equal(p.reached,true);assert.equal(p.percent,100);assert.equal(p.remaining,0);
 p=fastingProgress(s,'2026-10-12T08:30:00Z');assert.equal(p.elapsed,1020);assert.equal(p.percent,100);assert.equal(p.reached,true);
});
test('a saved plan stays stable until edited and an explicit no-target choice stays optional',()=>{
 const s=emptyState();s.activeFast={start:'2026-10-11T15:30:00Z',plannedMinutes:600};s.settings.eatingStart='13:30';assert.equal(fastingProgress(s,'2026-10-11T23:30:00Z').target,600);
 s.activeFast.plannedMinutes=null;assert.equal(fastingProgress(s).target,null);assert.equal(fastingProgress(s).reached,false);
 delete s.activeFast.plannedMinutes;s.settings.fastingOptional=false;assert.equal(fastingProgress(s).target,null);
});
test('legacy active fasts use the real saved schedule without modifying it',()=>{
 const s=emptyState();s.activeFast={start:'2026-10-11T15:30:00Z'};const before=JSON.stringify(s);assert.equal(fastingProgress(s,'2026-10-12T07:30:00Z').reached,true);assert.equal(JSON.stringify(s),before);
});
test('an early completed fast with its planned duration remains valid backup history',()=>{
 const s=emptyState();s.fasts=[{id:'early-fast',date:'2026-10-12',start:'2026-10-11T15:30:00Z',end:'2026-10-12T01:30:00Z',plannedMinutes:960,note:'Chose to end early'}];const restored=parseBackup(JSON.stringify(s));assert.equal(restored.fasts[0].plannedMinutes,960);assert.equal(restored.fasts[0].note,'Chose to end early');
});
test('sleep charts contain only explicit stage entries and mark missing time as unknown',()=>{
 const r=sleep();assert.equal(sleepStageSummary(r),null);r.stages={rem:90,awake:30};const result=sleepStageSummary(r);assert.equal(result.total,480);assert.equal(result.logged,120);assert.equal(result.unentered,360);assert.deepEqual(result.entries,[{key:'rem',name:'REM',minutes:90},{key:'awake',name:'Awake',minutes:30}]);
 r.stages={awake:0};assert.equal(sleepStageSummary(r).entries[0].minutes,0);assert.equal(sleepStageSummary(r).logged,0);
});
test('sleep stages and new settings survive backup round trips alongside old records and photos',()=>{
 const s=emptyState();s.settings.stepGoal=6500;s.sleep=[{...sleep(),stages:{rem:90,core:300,deep:60,awake:25}},{...sleep(),id:'older-sleep',date:'2026-10-11'}];s.meals=[{id:'existing-meal',date,name:'Existing lunch',calories:500,protein:25,fiber:null,favorite:true,photo:'data:image/jpeg;base64,YWJj'}];assert.deepEqual(parseBackup(JSON.stringify(s)),s);
});
test('sleep stage validation rejects invalid types, unknown stages, and inconsistent totals',()=>{
 for(const stages of [{rem:-1},{core:1.5},{deep:1441},{rem:'90'},{light:30},{rem:451},{rem:90,core:300,deep:61},{awake:1000},null,[]]){const s=emptyState();s.sleep=[{...sleep(),stages}];assert.throws(()=>validateState(s));}
});
test('fasting plan validation accepts absent or disabled targets and rejects bad targets',()=>{
 for(const plannedMinutes of [null,1,960,1440]){const s=emptyState();s.activeFast={start:'2026-10-11T15:30:00Z',plannedMinutes};validateState(s);}
 for(const plannedMinutes of [0,-1,1441,'960']){const s=emptyState();s.activeFast={start:'2026-10-11T15:30:00Z',plannedMinutes};assert.throws(()=>validateState(s));}
});
