import {test} from 'node:test';
import assert from 'node:assert/strict';
import {tabataAt} from './engine.mjs';
test('20秒の負荷、10秒の休憩、4種目を2セット',()=>{
 assert.equal(tabataAt(0,4,2).remaining,20);
 assert.equal(tabataAt(19999,4,2).remaining,1);
 assert.equal(tabataAt(20000,4,2).rest,true);
 assert.equal(tabataAt(20000,4,2).remaining,10);
 assert.equal(tabataAt(30000,4,2).index,1);
 assert.equal(tabataAt(120000,4,2).round,2);
 assert.equal(tabataAt(120000,4,2).index,0);
 assert.equal(tabataAt(239999,4,2).done,false);
 assert.equal(tabataAt(240000,4,2).done,true);
});
test('バックグラウンドから戻っても経過時間に追いつく',()=>{
 assert.deepEqual([tabataAt(175000,4,2).index,tabataAt(175000,4,2).remaining,tabataAt(175000,4,2).rest],[1,5,true]);
 assert.equal(tabataAt(999999,1,1).done,true);
});
