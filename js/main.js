// main.js  — fully rewritten, syntax‑error‑free  ---------------------------

// GLOBAL STATE
let currentScene = 0;               // 0‑based index of current scene
let dataset       = [];             // filtered 2025 data
const scenes      = [drawScene1, drawScene2, drawScene3];

//------------------------------------
//  DATA LOAD (only once)
//------------------------------------
d3.csv("data/salaries.csv").then(raw => {
  raw.forEach(d => {
    d.salary_in_usd = +d.salary_in_usd;
    d.remote_ratio  = +d.remote_ratio;
  });
  dataset = raw.filter(d => d.work_year === "2025");
  scenes[currentScene](dataset);     // render first scene
  updateButtons();                   // show / hide prev‑next
});

//------------------------------------
//  NAVIGATION BUTTONS
//------------------------------------
function updateButtons () {
  d3.select("#prevButton").style("display", currentScene === 0               ? "none" : "inline-block");
  d3.select("#nextButton").style("display", currentScene === scenes.length-1 ? "none" : "inline-block");
}

function nextScene () {
  if (currentScene < scenes.length - 1) {
    currentScene++;
    d3.select("#viz").html("");      // clear container
    scenes[currentScene](dataset);     // draw new scene
    updateButtons();
  }
}

function prevScene () {
  if (currentScene > 0) {
    currentScene--;
    d3.select("#viz").html("");
    scenes[currentScene](dataset);
    updateButtons();
  }
}

//------------------------------------
//  SCENE 1  —  Top‑5 Job Titles
//------------------------------------
function drawScene1 (data) {
  d3.select("#jobSelector").style("display","none");

  const svg    = d3.select("#viz").append("svg").attr("width",800).attr("height",600);
  const margin = {top:60,right:30,bottom:110,left:100}, width=800-margin.left-margin.right, height=500-margin.top-margin.bottom;
  const g      = svg.append("g").attr("transform`, `translate(${margin.left},${margin.top})");

  // Data prep
  const top5 = d3.rollups(data,v=>d3.mean(v,d=>d.salary_in_usd),d=>d.job_title)
                 .sort((a,b)=>d3.descending(a[1],b[1])).slice(0,5);

  const x = d3.scaleBand().domain(top5.map(d=>d[0])).range([0,width]).padding(0.2);
  const y = d3.scaleLinear().domain([0,d3.max(top5,d=>d[1])]).range([height,0]);

  // Title
  g.append("text").attr("x",width/2).attr("y",-30).attr("text-anchor","middle")
    .style("font-size",18).style("font-weight",600)
    .text("Top 5 Job Titles by Avg Salary (USD) in 2025");

  // Axes
  g.append("g").call(d3.axisLeft(y));
  g.append("g").attr("transform",`translate(0,${height})`).call(d3.axisBottom(x))
    .selectAll("text").attr("transform","rotate(-30)").style("text-anchor","end");

  // Bars
  g.selectAll("rect").data(top5).enter().append("rect")
    .attr("x",d=>x(d[0])).attr("y",d=>y(d[1]))
    .attr("width",x.bandwidth()).attr("height",d=>height-y(d[1]))
    .attr("fill","steelblue");

  // Annotation
  g.append("text")
    .attr("x",width/2).attr("y",height+60).attr("text-anchor","middle")
    .style("font-size",13)
    .text("These are the 5 highest‑paid job titles in 2025 by average salary.");
}

//------------------------------------
//  SCENE 2  —  Experience vs Salary w/ Dropdown
//------------------------------------
function drawScene2 (data) {
  // show dropdown
  const selector = d3.select("#jobSelector").style("display","inline-block");

  // build dropdown options once
  const jobs = [...new Set(data.map(d=>d.job_title))].sort();
  selector.selectAll("option").data(jobs).join("option")
          .attr("value",d=>d).text(d=>d);
  selector.on("change",function(){ updateScene2Job(this.value); });

  updateScene2Job(jobs[0]);
}

function updateScene2Job (jobTitle) {
  d3.select("#viz svg").remove();

  const svg    = d3.select("#viz").append("svg").attr("width",800).attr("height",600);
  const margin = {top:60,right:30,bottom:110,left:100}, width=800-margin.left-margin.right, height=500-margin.top-margin.bottom;
  const g      = svg.append("g").attr("transform",`translate(${margin.left},${margin.top})`);

  const filtered = dataset.filter(d=>d.job_title===jobTitle);
  const avg      = d3.rollups(filtered,v=>d3.mean(v,d=>d.salary_in_usd),d=>d.experience_level);
  const levels   = ["EN","MI","SE","EX"];

  const x = d3.scaleBand().domain(levels).range([0,width]).padding(0.2);
  const y = d3.scaleLinear().domain([0,d3.max(avg,d=>d[1])]).range([height,0]);

  // title
  g.append("text").attr("x",width/2).attr("y",-30).attr("text-anchor","middle")
    .style("font-size",18).style("font-weight",600)
    .text(`Average Salary by Experience — ${jobTitle}`);

  // axes
  g.append("g").call(d3.axisLeft(y));
  g.append("g").attr("transform",`translate(0,${height})`).call(d3.axisBottom(x));

  // bars
  g.selectAll("rect").data(avg).enter().append("rect")
    .attr("x",d=>x(d[0])).attr("y",d=>y(d[1]))
    .attr("width",x.bandwidth()).attr("height",d=>height-y(d[1]))
    .attr("fill","#ff9933");

  // annotation
  g.append("text")
    .attr("x",width/2).attr("y",height+60).attr("text-anchor","middle")
    .style("font-size",13)
    .text("EN = Entry · MI = Mid · SE = Senior · EX = Executive");
}

//------------------------------------
//  SCENE 3  —  Remote Ratio vs Salary
//------------------------------------
function drawScene3 (data) {
  d3.select("#jobSelector").style("display","none");

  const svg    = d3.select("#viz").append("svg").attr("width",800).attr("height",600);
  const margin = {top:60,right:30,bottom:110,left:100}, width=800-margin.left-margin.right, height=500-margin.top-margin.bottom;
  const g      = svg.append("g").attr("transform",`translate(${margin.left},${margin.top})`);

  const grouped = d3.groups(data,d=>d.remote_ratio).map(([k,v])=>({remote:k,avg:d3.mean(v,d=>d.salary_in_usd)}));
  const x = d3.scaleBand().domain(grouped.map(d=>d.remote)).range([0,width]).padding(0.2);
  const y = d3.scaleLinear().domain([0,d3.max(grouped,d=>d.avg)]).range([height,0]);

  // title
  g.append("text").attr("x",width/2).attr("y",-30).attr("text-anchor","middle")
    .style("font-size",18).style("font-weight",600)
    .text("Average Salary by Remote Ratio");

  g.append("g").call(d3.axisLeft(y));
  g.append("g").attr("transform",`translate(0,${height})`).call(d3.axisBottom(x).tickFormat(d=>`${d}%`));

  g.selectAll("rect").data(grouped).enter().append("rect")
    .attr("x",d=>x(d.remote)).attr("y",d=>y(d.avg))
    .attr("width",x.bandwidth()).attr("height",d=>height-y(d.avg))
    .attr("fill","#2ca02c");

  g.append("text")
    .attr("x",width/2).attr("y",height+60).attr("text-anchor","middle")
    .style("font-size",13)
    .text("0% = onsite · 50% = hybrid · 100% = fully remote");
}
