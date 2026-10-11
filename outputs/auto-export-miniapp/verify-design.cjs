const path = require('node:path');
const assert = require('node:assert/strict');
const {pathToFileURL} = require('node:url');
const deps='C:/Users/34334/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const {chromium}=require(path.join(deps,'playwright'));
const sharp=require(path.join(deps,'sharp'));
(async()=>{
  await sharp(path.join(__dirname,'design-overview.svg')).png().toFile(path.join(__dirname,'design-overview.png'));
  const browser=await chromium.launch({headless:true,channel:'chrome'});
  try {
    const page=await browser.newPage({viewport:{width:393,height:852},deviceScaleFactor:2});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(pathToFileURL(path.join(__dirname,'preview.html')).href);
    for(const [view,name] of [['home','01-new-chat'],['quote','02-quote-chat'],['history','03-history-drawer']]){
      await page.evaluate(v=>render(v),view);
      const overflow=await page.evaluate(()=>({page:document.documentElement.scrollWidth>innerWidth,text:[...document.querySelectorAll('.art svg text')].filter(t=>{const b=t.getBBox();return b.x<0||b.x+b.width>394}).map(t=>t.textContent)}));
      assert.equal(overflow.page,false);assert.deepEqual(overflow.text,[]);
      await page.screenshot({path:path.join(__dirname,name+'.png')});
    }
    await page.getByRole('searchbox',{name:'搜索历史对话'}).fill('阿尔及利亚');
    assert.equal(await page.locator('.history-result').count(),1);
    await page.locator('.history-result').click();
    await page.getByRole('button',{name:'打开历史对话',exact:true}).click();
    await page.getByRole('searchbox').fill('不存在的对话');
    await page.getByText('没有找到相关对话',{exact:true}).waitFor();
    await page.getByRole('button',{name:'新建对话',exact:true}).click();
    await page.getByRole('button',{name:'询问吉利缤越报价',exact:true}).click();
    await page.getByRole('button',{name:'筛选：白',exact:true}).click();
    const texts=await page.locator('#art').innerText();
    assert.ok(texts.includes('$8,100'));assert.ok(!texts.includes('$7,800'));
    await page.getByRole('button',{name:'查看全部配置',exact:true}).click();
    assert.equal(await page.locator('.quote-row').count(),3);
    await page.getByRole('button',{name:'关闭',exact:true}).click();
    await page.getByRole('button',{name:'车价计算器',exact:true}).click();
    await page.locator('#shipping').fill('1200');
    assert.equal(await page.locator('#total').innerText(),'$9,000');
    await page.keyboard.press('Escape');
    await page.getByRole('textbox',{name:'输入消息'}).fill('测试查询');
    await page.getByRole('button',{name:'发送消息',exact:true}).click();
    assert.equal(await page.locator('.custom-question').innerText(),'测试查询');
    await page.setViewportSize({width:360,height:800});
    await page.evaluate(()=>{activeQuestion='';customAnswer='';render('history')});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    await page.getByRole('searchbox').fill('缤越');assert.equal(await page.locator('.history-result').count(),1);
    await page.setViewportSize({width:1440,height:1080});
    await page.evaluate(()=>render('home'));
    await page.getByRole('button',{name:'历史对话',exact:true}).click();
    assert.equal(await page.getByRole('searchbox').isVisible(),true);
    assert.deepEqual(errors,[]);
    console.log(JSON.stringify({screens:3,viewports:['393x852 @2x','360x800','1440x1080'],checks:['SVG text bounds','no horizontal overflow','history search','empty search','new chat','history selection','color filter','all configurations','calculator','message input'],browserErrors:errors}));
  }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
