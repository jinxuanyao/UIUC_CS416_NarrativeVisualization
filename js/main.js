// main.js
let currentScene = 0;
let scenes = [drawScene1, drawScene2, drawScene3];
let dataset = [];

// Load and parse CSV
d3.csv("data/salaries.csv").then(data => {
  data.forEach(d => {
    d.salary_in_usd = +d.salary_in_usd;
    d.remote_ratio = +d.remote_ratio;
  });
  dataset = data.filter(d => d.work_year === "2025");
  scenes[currentScene](dataset);
  updateButtons();
});

function updateButtons() {
  d3.select("#prevButton").style("display", currentScene === 0 ? "none" : "inline-block");
  d3.select("#nextButton").style("display", currentScene === scenes.length - 1 ? "none" : "inline-block");
}

function nextScene() {
  if (currentScene < scenes.length - 1) {
    currentScene++;
    d3.select("#viz").html("");
    scenes[currentScene](dataset);
    updateButtons();
  }
}

function prevScene() {
  if (currentScene > 0) {
    currentScene--;
    d3.select("#viz").html("");
    scenes[currentScene](dataset);
    updateButtons();
  }
}

function drawScene1(data) {
  d3.select("#jobSelector").style("display", "none");

  const svg = d3.select("#viz")
                .append("svg")
                .attr("width", 800)
                .attr("height", 600);

  const jobAvg = d3.rollups(data, v => d3.mean(v, d => d.salary_in_usd), d => d.job_title);
  const top5 = jobAvg.sort((a, b) => d3.descending(a[1], b[1])).slice(0, 5);

  const margin = { top: 60, right: 30, bottom: 90, left: 100 };
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

  // title
  g.append("text")
   .attr("x", width / 2)
   .attr("y", -30)
   .attr("text-anchor", "middle")
   .style("font-size", "18px")
   .style("font-weight", "600")
   .text("Top 5 Job Titles by Avg Salary (USD) in 2025");

  // axes
  g.append("g").call(d3.axisLeft(y));
  g.append("g")
   .attr("transform", `translate(0,${height})`)
   .call(d3.axisBottom(x))
   .selectAll("text")
   .attr("transform", "rotate(-30)")
   .style("text-anchor", "end");

  // bars
  g.selectAll("rect")
   .data(top5)
   .enter()
   .append("rect")
   .attr("x", d => x(d[0]))
   .attr("y", d => y(d[1]))
   .attr("width", x.bandwidth())
   .attr("height", d => height - y(d[1]))
   .attr("fill", "steelblue");

  // annotation under chart
  g.append("text")
   .attr("x", width / 2)
   .attr("y", height + 50)
   .attr("text-anchor", "middle")
   .style("font-size", "13px")
   .text("These are the 2025 job titles with the highest average salaries.");
}
}

function drawScene2(data) {
  d3.select("#jobSelector").style("display", "inline-block");

  const svg = d3.select("#viz")
                .append("svg")
                .attr("width", 800)
                .attr("height", 600);

  const allJobs = [...new Set(data.map(d => d.job_title))].sort();
  const dropdown = d3.select("#jobSelector");
  dropdown.selectAll("option").remove();

  dropdown.selectAll("option")
          .data(allJobs)
          .enter()
          .append("option")
          .attr("value", d => d)
          .text(d => d);

  dropdown.on("change", function () {
    updateScene2Job(this.value);
  });

  updateScene2Job(allJobs[0]);
}

function updateScene2Job(jobTitle) {
  d3.select("svg").remove();

  const svg = d3.select("#viz")
                .append("svg")
                .attr("width", 800)
                .attr("height", 600);

  const filtered = dataset.filter(d => d.job_title === jobTitle);
  const avgSalary = d3.rollups(filtered, v => d3.mean(v, d => d.salary_in_usd), d => d.experience_level);
  const levels = ["EN", "MI", "SE", "EX"];

  const margin = { top: 60, right: 30, bottom: 90, left: 100 };
  const width = 800 - margin.left - margin.right;
  const height = 500 - margin.top - margin.bottom;

  const x = d3.scaleBand()
              .domain(levels)
              .range([0, width])
              .padding(0.2);
  const y = d3.scaleLinear()
              .domain([0, d3.max(avgSalary, d => d[1])])
              .range([height, 0]);

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  // title
  g.append("text")
   .attr("x", width / 2)
   .attr("y", -30)
   .attr("text-anchor", "middle")
   .style("font-size", "18px")
   .style("font-weight", "600")
   .text(`Average Salary by Experience — ${jobTitle}`);

  g.append("g").call(d3.axisLeft(y));
  g.append("g")
   .attr("transform", `translate(0,${height})`)
   .call(d3.axisBottom(x));

  g.selectAll("rect")
   .data(avgSalary)
   .enter()
   .append("rect")
   .attr("x", d => x(d[0]))
   .attr("y", d => y(d[1]))
   .attr("width", x.bandwidth())
   .attr("height", d => height - y(d[1]))
   .attr("fill", "#ff9933");

  // annotation
  g.append("text")
   .attr("x", width / 2)
   .attr("y", height + 50)
   .attr("text-anchor", "middle")
   .style("font-size", "13px")
   .text("EN = Entry · MI = Mid · SE = Senior · EX = Executive");
}
}

function drawScene3(data) {
  d3.select("#jobSelector").style("display", "none");

  const svg = d3.select("#viz")
                .append("svg")
                .attr("width", 800)
                .attr("height", 600);

  const groups = d3.groups(data, d => d.remote_ratio);
  const result = groups.map(([key, values]) => ({ remote_ratio: key, avg_salary: d3.mean(values, d => d.salary_in_usd) }));

  const margin = { top: 60, right: 30, bottom: 90, left: 100 };
  const width = 800 - margin.left - margin.right;
  const height = 500 - margin.top - margin.bottom;

  const x = d3.scaleBand().domain(result.map(d => d.remote_ratio)).range([0, width]).padding(0.2);
  const y = d3.scaleLinear().domain([0, d3.max(result, d => d.avg_salary)]).range([height, 0]);

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  // title
  g.append("text")
   .attr("x", width / 2)
   .attr("y", -30)
   .attr("text-anchor", "middle")
   .style("font-size", "18px")
   .style("font-weight", "600")
   .text("Average Salary by Remote Ratio");

  g.append("g").call(d3.axisLeft(y));
  g.append("g")
   .attr("transform", `translate(0,${height})`)
   .call(d3.axisBottom(x).tickFormat(d => `${d}%`));

  g.selectAll("rect")
   .data(result)
   .enter()
   .append("rect")
   .attr("x", d => x(d.remote_ratio))
   .attr("y", d => y(d.avg_salary))
   .attr("width", x.bandwidth())
   .attr("height", d => height - y(d.avg_salary))
   .attr("fill", "#2ca02c");

  // annotation
  g.append("text")
   .attr("x", width / 2)
   .attr("y", height + 50)
   .attr("text-anchor", "middle")
   .style("font-size", "13px")
   .text("0% = onsite · 50% = hybrid · 100% = fully remote");

  updateButtons();
}

  updateButtons();
}
 
