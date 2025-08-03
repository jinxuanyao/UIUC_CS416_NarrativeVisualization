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
// Updated drawScene1 with annotation moved and enhanced
function drawScene1(data) {
  d3.select("#jobSelector").style("display", "none");

  const svg = d3.select("#viz").append("svg")
    .attr("width", 900)  // Increased width to allow annotation on right
    .attr("height", 720); // increased height

  const margin = { top: 60, right: 250, bottom: 130, left: 100 };  // wider right margin for side annotation
  const width = 900 - margin.left - margin.right;
  const height = 600 - margin.top - margin.bottom;

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const top5 = d3.rollups(data, v => d3.mean(v, d => d.salary_in_usd), d => d.job_title)
    .sort((a, b) => d3.descending(a[1], b[1]))
    .slice(0, 5);

  const x = d3.scaleBand()
    .domain(top5.map(d => d[0]))
    .range([0, width])
    .padding(0.2);

  const y = d3.scaleLinear()
    .domain([0, d3.max(top5, d => d[1])])
    .range([height, 0]);

  g.append("text")
    .attr("x", width / 2)
    .attr("y", -30)
    .attr("text-anchor", "middle")
    .style("font-size", 18)
    .style("font-weight", 600)
    .text("Top 5 Job Titles by Avg Salary (USD) in 2025");

  g.append("g").call(d3.axisLeft(y));
  g.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "rotate(-30)")
    .style("text-anchor", "end");

  g.selectAll("rect")
    .data(top5)
    .enter().append("rect")
    .attr("x", d => x(d[0]))
    .attr("y", d => y(d[1]))
    .attr("width", x.bandwidth())
    .attr("height", d => height - y(d[1]))
    .attr("fill", "steelblue");

  // Side annotation
  svg.append("foreignObject")
    .attr("x", width + margin.left + 10)
    .attr("y", margin.top + 40)  // pushed further down
    .attr("width", 200)
    .attr("height", 200)
    .append("xhtml:div")
    .style("font-size", "13px")
    .style("color", "#333")
    .html(`<strong>Insight:</strong><br>
      X-axis shows the job titles with the highest average salaries.<br>
      These are the 5 highest-paid job titles in 2025 by average salary.<br>
      We can see it's over 250,000 per year.`);
}


//------------------------------------
//  SCENE 2  —  Experience vs Salary w/ Dropdown
//------------------------------------
// Updated drawScene2 with instruction annotation
function drawScene2(data) {
  const selector = d3.select("#jobSelector").style("display", "inline-block");

  const jobs = [...new Set(data.map(d => d.job_title))].sort();
  selector.selectAll("option").data(jobs).join("option")
          .attr("value", d => d).text(d => d);
  selector.on("change", function () { updateScene2Job(this.value); });

  updateScene2Job(jobs[0]);
}

function updateScene2Job(jobTitle) {
  d3.select("#viz svg").remove();

  const svg = d3.select("#viz").append("svg")
    .attr("width", 900)
    .attr("height", 700);

  const margin = { top: 60, right: 250, bottom: 130, left: 100 };
  const width = 900 - margin.left - margin.right;
  const height = 600 - margin.top - margin.bottom;
  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const filtered = dataset.filter(d => d.job_title === jobTitle);
  const avg = d3.rollups(filtered, v => d3.mean(v, d => d.salary_in_usd), d => d.experience_level);
  const levels = ["EN", "MI", "SE", "EX"];

  const x = d3.scaleBand().domain(levels).range([0, width]).padding(0.2);
  const y = d3.scaleLinear().domain([0, d3.max(avg, d => d[1])]).range([height, 0]);

  g.append("text").attr("x", width / 2).attr("y", -30).attr("text-anchor", "middle")
    .style("font-size", 18).style("font-weight", 600)
    .text(`Average Salary by Experience — ${jobTitle}`);

  g.append("g").call(d3.axisLeft(y));
  g.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x));

  g.selectAll("rect").data(avg).enter().append("rect")
    .attr("x", d => x(d[0])).attr("y", d => y(d[1]))
    .attr("width", x.bandwidth()).attr("height", d => height - y(d[1]))
    .attr("fill", "#ff9933");

  svg.append("foreignObject")
    .attr("x", width + margin.left + 10)
    .attr("y", margin.top + 40)
    .attr("width", 220)
    .attr("height", 200)
    .append("xhtml:div")
    .style("font-size", "13px")
    .style("color", "#333")
    .html(`<strong>Instruction:</strong><br>
      Use the dropdown menu above to view salary trends by experience level for each job title.<br>
      EN = Entry · MI = Mid · SE = Senior · EX = Executive.`);
}


//------------------------------------
//  SCENE 3  —  Remote Ratio vs Salary
//------------------------------------
// Updated drawScene3 with content-based annotation
function drawScene3(data) {
  d3.select("#jobSelector").style("display", "none");

  const svg = d3.select("#viz").append("svg")
    .attr("width", 900)
    .attr("height", 700);

  const margin = { top: 60, right: 250, bottom: 130, left: 100 };
  const width = 900 - margin.left - margin.right;
  const height = 600 - margin.top - margin.bottom;
  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const grouped = d3.groups(data, d => d.remote_ratio).map(([k, v]) => ({ remote: k, avg: d3.mean(v, d => d.salary_in_usd) }));
  const x = d3.scaleBand().domain(grouped.map(d => d.remote)).range([0, width]).padding(0.2);
  const y = d3.scaleLinear().domain([0, d3.max(grouped, d => d.avg)]).range([height, 0]);

  g.append("text").attr("x", width / 2).attr("y", -30).attr("text-anchor", "middle")
    .style("font-size", 18).style("font-weight", 600)
    .text("Average Salary by Remote Ratio");

  g.append("g").call(d3.axisLeft(y));
  g.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x).tickFormat(d => `${d}%`));

  g.selectAll("rect").data(grouped).enter().append("rect")
    .attr("x", d => x(d.remote)).attr("y", d => y(d.avg))
    .attr("width", x.bandwidth()).attr("height", d => height - y(d.avg))
    .attr("fill", "#2ca02c");

  svg.append("foreignObject")
    .attr("x", width + margin.left + 10)
    .attr("y", margin.top + 60)
    .attr("width", 240)
    .attr("height", 240)
    .append("xhtml:div")
    .style("font-size", "13px")
    .style("color", "#333")
    .html(`<strong>Insight:</strong><br>
      X-axis shows remote work percentage: 0% = onsite, 50% = hybrid, 100% = fully remote.<br><br>
      Surprisingly, both 0% and 100% remote roles have higher salaries, while 50% hybrid roles show the lowest average pay.`);
}

 
