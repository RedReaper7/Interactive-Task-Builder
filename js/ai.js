const AI_KEY='teachai_results_v1';
const studentsSeed=[
 ['Дамир Ахметов',96,'Отлично',['HTML','CSS']],['София Ким',91,'Отлично',['HTML','JavaScript']],['Марат Сейтов',84,'Хорошо',['CSS','JavaScript']],['Аружан Нурбек',78,'Хорошо',['HTML','JavaScript']],['Тимофей Волков',73,'Хорошо',['JavaScript']],['Диана Садыкова',68,'Затруднение',['JavaScript','HTML']],['Ернар Абдрахман',64,'Затруднение',['JavaScript']],['Милана Орлова',57,'Повторить',['HTML','JavaScript']],['Алихан Жумаев',92,'Отлично',['CSS','HTML']],['Аделина Касымова',88,'Хорошо',['HTML','CSS']],['Ринат Омаров',76,'Хорошо',['JavaScript']],['Сабина Тлеубек',69,'Затруднение',['JavaScript','CSS']],['Арсен Исаев',95,'Отлично',['HTML']],['Ясмина Каримова',82,'Хорошо',['CSS']],['Нурали Беков',61,'Затруднение',['JavaScript']],['Элина Ахметова',89,'Хорошо',['HTML','CSS']]
].map((x,i)=>({id:i,name:x[0],score:x[1],status:x[2],weak:x[3]}));
function load(){
  try{
    const x=JSON.parse(localStorage.getItem(AI_KEY));
    const arr=Array.isArray(x)&&x.length?x:studentsSeed;
    return arr.map(s=>({...s,teacherGrade:Number.isFinite(+s.teacherGrade)?+s.teacherGrade:Math.round(s.score/10*10)/10}));
  }catch(e){return studentsSeed.map(s=>({...s,teacherGrade:Math.round(s.score/10*10)/10}))}
}
function save(x){localStorage.setItem(AI_KEY,JSON.stringify(x))}
let students=load();
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"']/g,c=>'&#'+c.charCodeAt(0)+';');
function statusClass(s){return s==='Отлично'?'good':s==='Хорошо'?'mid':'low'}
function renderStats(){const avg=Math.round(students.reduce((a,s)=>a+s.score,0)/students.length), hi=students.filter(s=>s.score>=85).length, mid=students.filter(s=>s.score>=70&&s.score<85).length, low=students.filter(s=>s.score<70).length;$('#stats').innerHTML=`<div class="stat-card"><small>Средний результат</small><strong>${avg}%</strong><em class="green-text">по ${students.length} ученикам</em></div><div class="stat-card"><small>Высокий результат</small><strong>${hi}</strong><em class="green-text">85% и выше</em></div><div class="stat-card"><small>Есть затруднения</small><strong class="orange-text">${mid+low}</strong><em>нужно внимание</em></div><div class="stat-card"><small>Нужно повторение</small><strong class="red-text">${low}</strong><em>ниже 70%</em></div>`}
function renderStudents(){let a=[...students];const mode=$('#sort').value;if(mode==='score')a.sort((x,y)=>y.score-x.score);if(mode==='name')a.sort((x,y)=>x.name.localeCompare(y.name,'ru'));if(mode==='status')a.sort((x,y)=>y.score-x.score);$('#students').innerHTML=a.map(s=>`<div class="student" data-id="${s.id}"><div class="student-name"><b>${esc(s.name)}</b><small>Последнее задание: JavaScript / Web</small></div><div class="score">${s.score}%</div><div><div class="mini-bar"><i style="width:${s.score}%"></i></div></div><span class="status ${statusClass(s.status)}">${s.status}</span></div>`).join('');document.querySelectorAll('.student').forEach(x=>x.onclick=()=>detail(+x.dataset.id))}
function renderInsights(){const avg=Math.round(students.reduce((a,s)=>a+s.score,0)/students.length);const weak={};students.forEach(s=>s.weak.forEach(t=>weak[t]=(weak[t]||0)+1));const top=Object.entries(weak).sort((a,b)=>b[1]-a[1])[0]||['JavaScript',0];const low=students.filter(s=>s.score<70).map(s=>s.name);$('#insights').innerHTML=`<div class="insight"><b>✦ Групповой анализ</b><p>Средний результат — <strong>${avg}%</strong>. ${avg>=80?'Большая часть группы уверенно выполняет задания.':'Группе полезно повторить основные темы.'}</p></div><div class="insight"><b>⚠ Частая зона затруднений</b><p>Чаще всего отмечается тема <strong>${top[0]}</strong> (${top[1]} учен.).</p></div><div class="insight"><b>→ Рекомендация</b><p>${low.length?`Дать дополнительную практику: ${low.slice(0,3).join(', ')}${low.length>3?' и другим ученикам':''}.`:'Можно перейти к следующей теме и дать усложнённое задание.'}</p></div>`;$('#analysisTime').textContent='AI-анализ обновлён только что'}
function renderTopics(){const topics=[['HTML',84],['CSS',79],['JavaScript',68],['Работа с DOM',73]];$('#topicBars').innerHTML=topics.map(([n,v])=>`<div class="topic"><div class="topic-head"><span>${n}</span><b>${v}%</b></div><div class="topic-bar"><i style="width:${v}%"></i></div></div>`).join('')}
function initials(name){
  return name.split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase();
}
function detail(id){
  const s=students.find(x=>x.id===id);
  if(!s)return;

  const aiAdvice=()=>{
    const p=s.score;
    if(p>=90)return 'Результат высокий. Можно предложить усложнённое задание или дополнительный творческий уровень.';
    if(p>=80)return `Основные критерии освоены. Стоит закрепить тему «${s.weak[0]}» коротким практическим упражнением.`;
    if(p>=70)return `Есть отдельные ошибки. Рекомендуется повторить «${s.weak[0]}» и дать 1–2 задания на закрепление.`;
    return `Результат требует дополнительной поддержки. Рекомендуется разобрать тему «${s.weak[0]}» и дать повторную попытку.`;
  };

  const statusText=s.score>=85?'Высокий результат':s.score>=70?'Стабильный результат':'Нужна дополнительная практика';

  $('#detail').innerHTML=`
    <div class="detail-layout">
      <div class="detail-hero">
        <div>
          <div class="detail-avatar">${esc(initials(s.name))}</div>
          <div class="detail-score">${s.score}%</div>
          <div class="detail-score-label">Результат задания</div>
        </div>
        <div style="font-size:10px;color:#dce4ff">AI-профиль · данные обновляются после оценки</div>
      </div>

      <div class="detail-main">
        <div class="eyebrow">ПРОВЕРКА РАБОТЫ</div>
        <h2>${esc(s.name)}</h2>
        <p class="muted">${statusText}<span class="teacher-badge">Оценка учителя: ${s.teacherGrade}/10</span></p>

        <div class="detail-section">
          <h3>Результат выполнения</h3>
          <b>${s.score}%</b>
          <div class="detail-progress"><i style="width:${s.score}%"></i></div>
          <p class="muted" style="margin:8px 0 0">${s.score>=85?'Большинство критериев выполнено уверенно.':s.score>=70?'Основная часть задания выполнена правильно.':'Есть темы, которые стоит повторить.'}</p>
        </div>

        <div class="grade-box">
          <h3 style="margin:0 0 9px">✎ Оценка преподавателя</h3>
          <div class="grade-row">
            <input id="teacherGrade" class="grade-input" type="number" min="0" max="10" step="0.5" value="${s.teacherGrade}">
            <span style="font-size:12px;color:#70768a">из 10</span>
            <button id="saveGrade" class="btn grade-save">Сохранить оценку</button>
          </div>
          <div id="gradeResult" class="ai-grade-result">
            AI подготовит рекомендацию после сохранения оценки.
          </div>
        </div>

        <div class="detail-section">
          <h3>Зоны внимания</h3>
          ${s.weak.map(t=>`<span class="detail-tag">${esc(t)}</span>`).join('')}
        </div>

        <div class="detail-section">
          <h3>✦ AI-помощник учителя</h3>
          <p style="margin:0;font-size:12px;line-height:1.65">${aiAdvice()}</p>
        </div>

        <div class="detail-actions">
          <button class="btn" id="modalClose">Закрыть</button>
          <button class="btn ai-btn" id="modalAdvice">✦ Обновить AI-анализ</button>
        </div>
      </div>
    </div>`;

  $('#modal').hidden=false;

  $('#modalClose').onclick=()=>$('#modal').hidden=true;

  $('#saveGrade').onclick=()=>{
    const value=Number($('#teacherGrade').value);
    if(!Number.isFinite(value)||value<0||value>10){
      $('#gradeResult').textContent='Введите оценку от 0 до 10.';
      return;
    }
    s.teacherGrade=value;
    // Teacher's grade becomes the official displayed result.
    s.score=Math.round(value*10);
    s.status=s.score>=85?'Отлично':s.score>=70?'Хорошо':s.score>=60?'Затруднение':'Повторить';
    save(students);
    render();
    const result=$('#gradeResult');
    result.innerHTML=`<b>✓ Оценка сохранена: ${value}/10 (${s.score}%).</b><br>${aiAdvice()}`;
  };

  $('#modalAdvice').onclick=()=>{
    $('#gradeResult').innerHTML=`<b>✦ AI-анализ обновлён</b><br>${aiAdvice()}`;
  };
}
function render(){renderStats();renderStudents();renderInsights();renderTopics()}
$('#sort').onchange=renderStudents;$('#analyzeBtn').onclick=()=>{renderInsights();$('#analyzeBtn').textContent='✓ Анализ обновлён';setTimeout(()=>$('#analyzeBtn').textContent='✦ Анализировать группу',1800)};$('#newData').onclick=()=>{students=students.map(s=>({...s,score:Math.max(45,Math.min(99,s.score+Math.round(Math.random()*10-5)))}));students.forEach(s=>s.status=s.score>=85?'Отлично':s.score>=70?'Хорошо':s.score>=60?'Затруднение':'Повторить');save(students);render()};$('#close').onclick=()=>$('#modal').hidden=true;$('#modal').onclick=e=>{if(e.target.id==='modal')$('#modal').hidden=true};render();

document.addEventListener('keydown',e=>{if(e.key==='Escape')$('#modal').hidden=true});
