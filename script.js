const tools=[
{name:'ChatGPT',cat:'Chat',url:'https://chatgpt.com'},
{name:'Claude',cat:'Chat',url:'https://claude.ai'},
{name:'Gemini',cat:'Chat',url:'https://gemini.google.com'},
{name:'Canva AI',cat:'Image',url:'https://canva.com'},
{name:'Runway',cat:'Video',url:'https://runwayml.com'},
{name:'GitHub Copilot',cat:'Coding',url:'https://github.com/features/copilot'}
];
const wrap=document.getElementById('tools');
const s=document.getElementById('search');
function render(q=''){
wrap.innerHTML='';
tools.filter(t=>t.name.toLowerCase().includes(q.toLowerCase())).forEach(t=>{
wrap.innerHTML+=`<div class="card"><h3>${t.name}</h3><p>${t.cat}</p><a href="${t.url}" target="_blank">Open Tool</a></div>`;
});
}
s.oninput=e=>render(e.target.value);
render();
