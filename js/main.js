let currentScene = 0;
let scenes = [drawScene1, drawScene2, drawScene3];
let dataset = [];

d3.csv("data/salaries.csv").then(data => {
  data.forEach(d => {
    d.salary_in_usd = +d.salary_in_usd;
    d.remote_ratio = +d.remote_ratio;
  });
  dataset = data.filter(d => d.work_year === "2025");
  scenes[currentScene](dataset);
});

function nextScene() {
  if (currentScene < scenes.length - 1) {
    currentScene++;
    d3.select("#viz").html("");
    scenes[currentScene](dataset);
  }
}

function prevScene() {
  if (currentScene > 0) {
    currentScene--;
    d3.select("#viz").html("");
    scenes[currentScene](dataset);
  }
}

// Scene 1 – Top 5 job titles by average salary
function drawScene1(data) {
  const svg = d3.select("#viz")
                .append("svg")
                .attr("width", 800)
                .attr("height", 500);

  const jobAvg = d3.rollups(data, v => d3.mean(v, d => d.salary_in_usd), d => d.job_title);
  const top5 = jobAvg.sort((a, b) => d3.descending(a[1], b[1])).slice(0, 5);

  const margin = { top: 40, right: 30, bottom: 70, left: 100 };
  const width = 800 - margin.left - margin.right;
  const height = 500 - margin.top - margin.bottom;

  const x = d3.scaleBand()
              .domain(top5.map(d => d[0]))
              .range([0, width])
              .padding(0.2);

  const y = d3.scaleLinear()
              .domain([0, d3.max(top5, d => d[1])])
              .range([height, 0]);

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  g.append("g").call(d3.axisLeft(y));

  g.append("g")
   .attr("transform", `translate(0,${height})`)
   .call(d3.axisBottom(x))
   .selectAll("text")
   .attr("transform", "rotate(-30)")
   .style("text-anchor", "end");

  g.selectAll("rect")
   .data(top5)
   .enter()
   .append("rect")
   .attr("x", d => x(d[0]))
   .attr("y", d => y(d[1]))
   .attr("width", x.bandwidth())
   .attr("height", d => height - y(d[1]))
   .attr("fill", "steelblue");

  g.append("text")
   .attr("x", width / 2)
   .attr("y", -10)
   .attr("text-anchor", "middle")
   .text("Top 5 Job Titles by Avg Salary (USD) in 2025")
   .style("font-size", "16px")
   .style("font-weight", "bold");
}

function drawScene2(data) {
  d3.select("#viz").append("p").text("Scene 2 coming soon...");
}
function drawScene3(data) {
  d3.select("#viz").append("p").text("Scene 3 coming soon...");
}
function updateScene2Job(job) {
}
