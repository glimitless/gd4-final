// Load D3.js from CDN
const script = document.createElement('script');
script.src = "./d3.v7.min.js";
document.head.appendChild(script);

script.onload = function() {
    // Adjusted margins to prevent overlap
    const margin = {top: 20, right: 120, bottom: 20, left: 250};
    const visContainer = document.querySelector('.vis_net-generation-by-sector');
    const width = visContainer.clientWidth - margin.left - margin.right;
    const chartHeight = visContainer.clientHeight;
    
    // Set up total generation chart
    const totalGenMargin = {top: 40, right: 60, bottom: 40, left: 60};
    const totalGenContainer = document.querySelector('.vis_net-generation-total');
    const totalGenWidth = 300;
    const totalGenHeight = 150;

    // Create SVG for total generation line chart with centered positioning
    const totalGenSvg = d3.select('.vis_net-generation-total')
        .append('svg')
        .attr('width', totalGenWidth + totalGenMargin.left + totalGenMargin.right)
        .attr('height', totalGenHeight + totalGenMargin.top + totalGenMargin.bottom)
        .style('display', 'block')
        .style('margin', '0 auto')
        .append('g')
        .attr('transform', `translate(${totalGenMargin.left},${totalGenMargin.top})`);

    // Set up carbon emissions chart
    const carbonMargin = {top: 40, right: 60, bottom: 40, left: 60};
    const carbonContainer = document.querySelector('.vis_carbon-emissions');
    const carbonWidth = 300;
    const carbonHeight = 150;

    // Create SVG for carbon emissions line chart with centered positioning
    const carbonSvg = d3.select('.vis_carbon-emissions')
        .append('svg')
        .attr('width', carbonWidth + carbonMargin.left + carbonMargin.right)
        .attr('height', carbonHeight + carbonMargin.top + carbonMargin.bottom)
        .style('display', 'block')
        .style('margin', '0 auto')
        .append('g')
        .attr('transform', `translate(${carbonMargin.left},${carbonMargin.top})`);

    // At the top of the script, after the margin declarations
    let totalGenData, carbonData, xScale, carbonXScale; // Declare all global variables at the top

    // Create separate function for line charts
    function createLineCharts() {
        // Total Generation Chart
        d3.csv('data/renewable_net-generation-over-time-us-total.csv').then(function(data) {
            totalGenData = data; // Store the raw data globally
            
            // Process and restructure the data
            const processedData = data.reduce((acc, row) => {
                const year = +row.Year;
                if (!acc[year]) {
                    acc[year] = { Year: year };
                }
                acc[year][row.Class] = +row['Amount Generated (thousand megawatthours)'];
                return acc;
            }, {});
            
            const lineData = Object.values(processedData);

            xScale = d3.scaleLinear() // Store in global variable
                .domain(d3.extent(lineData, d => d.Year))
                .range([0, totalGenWidth]);

            const yScale = d3.scaleLinear()
                .domain([0, d3.max(lineData, d => d.Total)])
                .range([totalGenHeight, 0]);

            // Clear existing elements
            totalGenSvg.selectAll('*').remove();

            // Add axes with more visible ticks and grid lines
            const xAxis = d3.axisBottom(xScale)
                .tickFormat(d3.format('d'))
                .ticks(10);
            const yAxis = d3.axisLeft(yScale)
                .tickFormat(d3.format('.2s'))
                .ticks(8);

            // Add grid lines
            totalGenSvg.append('g')
                .attr('class', 'grid')
                .attr('opacity', 0.1)
                .call(d3.axisBottom(xScale)
                    .tickSize(totalGenHeight)
                    .tickFormat(''))
                .selectAll('line')
                .style('stroke', '#F6F0ED');

            totalGenSvg.append('g')
                .attr('class', 'grid')
                .attr('opacity', 0.1)
                .call(d3.axisLeft(yScale)
                    .tickSize(-totalGenWidth)
                    .tickFormat(''))
                .selectAll('line')
                .style('stroke', '#F6F0ED');

            // Add axes
            totalGenSvg.append('g')
                .attr('transform', `translate(0,${totalGenHeight})`)
                .call(xAxis)
                .selectAll('text, line')
                .style('stroke', 'rgba(246, 240, 237, 0.8)')
                .style('fill', 'rgba(246, 240, 237, 0.8)');

            totalGenSvg.append('g')
                .call(yAxis)
                .selectAll('text, line')
                .style('stroke', 'rgba(246, 240, 237, 0.8)')
                .style('fill', 'rgba(246, 240, 237, 0.8)');

            // Create line and area generators
            const totalArea = d3.area()
                .x(d => xScale(d.Year))
                .y0(totalGenHeight)
                .y1(d => yScale(d.Total));

            const renewableArea = d3.area()
                .x(d => xScale(d.Year))
                .y0(totalGenHeight)
                .y1(d => yScale(d.Renewable));

            // Add gradient definitions
            const totalGradient = totalGenSvg.append("defs")
                .append("linearGradient")
                .attr("id", "total-area-gradient")
                .attr("x1", "0%")
                .attr("y1", "0%")
                .attr("x2", "0%")
                .attr("y2", "100%");

            totalGradient.append("stop")
                .attr("offset", "0%")
                .attr("stop-color", "#8B0000") // Dark red for non-renewable
                .attr("stop-opacity", 0.8);

            totalGradient.append("stop")
                .attr("offset", "100%")
                .attr("stop-color", "#8B0000")
                .attr("stop-opacity", 0.1);

            const renewableGradient = totalGenSvg.append("defs")
                .append("linearGradient")
                .attr("id", "renewable-area-gradient")
                .attr("x1", "0%")
                .attr("y1", "0%")
                .attr("x2", "0%")
                .attr("y2", "100%");

            renewableGradient.append("stop")
                .attr("offset", "0%")
                .attr("stop-color", "#006400") // Dark green for renewable
                .attr("stop-opacity", 0.8);

            renewableGradient.append("stop")
                .attr("offset", "100%")
                .attr("stop-color", "#006400")
                .attr("stop-opacity", 0.1);

            // Add the total generation area
            totalGenSvg.append('path')
                .datum(lineData)
                .attr('fill', 'url(#total-area-gradient)')
                .attr('d', totalArea);

            // Add the renewable generation area
            totalGenSvg.append('path')
                .datum(lineData)
                .attr('fill', 'url(#renewable-area-gradient)')
                .attr('d', renewableArea);

            // Add the lines on top for better definition
            const totalLine = d3.line()
                .x(d => xScale(d.Year))
                .y(d => yScale(d.Total));

            const renewableLine = d3.line()
                .x(d => xScale(d.Year))
                .y(d => yScale(d.Renewable));

            totalGenSvg.append('path')
                .datum(lineData)
                .attr('fill', 'none')
                .attr('stroke', '#8B0000')
                .attr('stroke-width', 1.5)
                .attr('d', totalLine);

            totalGenSvg.append('path')
                .datum(lineData)
                .attr('fill', 'none')
                .attr('stroke', '#006400')
                .attr('stroke-width', 1.5)
                .attr('d', renewableLine);

            // Keep the title and axis labels as they were
            totalGenSvg.append('text')
                .attr('x', totalGenWidth / 2)
                .attr('y', -totalGenMargin.top / 2)
                .attr('text-anchor', 'middle')
                .style('font-size', '14px')
                .style('font-weight', 'bold')
                .style('fill', 'rgba(246, 240, 237, 0.8)')
                .text('US Energy Generated From 2001 to 2022');

            totalGenSvg.append('text')
                .attr('transform', 'rotate(-90)')
                .attr('y', -totalGenMargin.left + 15)
                .attr('x', -totalGenHeight / 2)
                .attr('text-anchor', 'middle')
                .style('font-size', '12px')
                .style('fill', 'rgba(246, 240, 237, 0.8)')
                .text('Energy Generated (thousand MWh)');
        });

        // Carbon Emissions Chart
        d3.csv('data/carbon-emissions-over-time-us-total.csv').then(function(data) {
            carbonData = data; // Store the raw data globally
            data.forEach(d => {
                d.Year = +d.Year;
                d.value = +d['tonnes of carbon dioxide-equivalents'];
            });

            carbonXScale = d3.scaleLinear() // Store in global variable
                .domain(d3.extent(data, d => d.Year))
                .range([0, carbonWidth]);

            const yScale = d3.scaleLinear()
                .domain([5000000000, d3.max(data, d => d.value)])
                .range([carbonHeight, 0]);

            // Clear existing elements
            carbonSvg.selectAll('*').remove();

            // Add axes with more visible ticks and grid lines
            const xAxis = d3.axisBottom(carbonXScale)
                .tickFormat(d3.format('d'))
                .ticks(10);
            const yAxis = d3.axisLeft(yScale)
                .tickFormat(d3.format('.2s'))
                .ticks(8);

            // Add grid lines
            carbonSvg.append('g')
                .attr('class', 'grid')
                .attr('opacity', 0.1)
                .call(d3.axisBottom(carbonXScale)
                    .tickSize(carbonHeight)
                    .tickFormat(''))
                .selectAll('line')
                .style('stroke', '#F6F0ED');

            carbonSvg.append('g')
                .attr('class', 'grid')
                .attr('opacity', 0.1)
                .call(d3.axisLeft(yScale)
                    .tickSize(-carbonWidth)
                    .tickFormat(''))
                .selectAll('line')
                .style('stroke', '#F6F0ED');

            // Add axes with more prominent ticks
            carbonSvg.append('g')
                .attr('transform', `translate(0,${carbonHeight})`)
                .call(xAxis)
                .selectAll('text, line')
                .style('stroke', 'rgba(246, 240, 237, 0.8)')
                .style('fill', 'rgba(246, 240, 237, 0.8)');

            carbonSvg.append('g')
                .call(yAxis)
                .selectAll('text, line')
                .style('stroke', 'rgba(246, 240, 237, 0.8)')
                .style('fill', 'rgba(246, 240, 237, 0.8)');

            // Add area
            const area = d3.area()
                .x(d => carbonXScale(d.Year))
                .y0(carbonHeight) // Bottom of the chart
                .y1(d => yScale(d.value));

            // Add gradient definition
            const gradient = carbonSvg.append("defs")
                .append("linearGradient")
                .attr("id", "carbon-area-gradient")
                .attr("x1", "0%")
                .attr("y1", "0%")
                .attr("x2", "0%")
                .attr("y2", "100%");

            gradient.append("stop")
                .attr("offset", "0%")
                .attr("stop-color", "#8B0000") // Dark red matching non-renewable
                .attr("stop-opacity", 0.8);

            gradient.append("stop")
                .attr("offset", "100%")
                .attr("stop-color", "#8B0000")
                .attr("stop-opacity", 0.1);

            // Add the area
            carbonSvg.append('path')
                .datum(data)
                .attr('fill', 'url(#carbon-area-gradient)')
                .attr('d', area);

            // Add the line on top
            const line = d3.line()
                .x(d => carbonXScale(d.Year))
                .y(d => yScale(d.value));

            carbonSvg.append('path')
                .datum(data)
                .attr('fill', 'none')
                .attr('stroke', '#8B0000') // Dark red matching non-renewable
                .attr('stroke-width', 1.5)
                .attr('d', line);

            // Add title
            carbonSvg.append('text')
                .attr('x', carbonWidth / 2)
                .attr('y', -carbonMargin.top / 2)
                .attr('text-anchor', 'middle')
                .style('font-size', '14px')
                .style('font-weight', 'bold')
                .style('fill', 'rgba(246, 240, 237, 0.8)')
                .text('US Carbon Emissions From 2001 to 2022');

            // Add y-axis label
            carbonSvg.append('text')
                .attr('transform', 'rotate(-90)')
                .attr('y', -carbonMargin.left + 15)
                .attr('x', -carbonHeight / 2)
                .attr('text-anchor', 'middle')
                .style('font-size', '12px')
                .style('fill', 'rgba(246, 240, 237, 0.8)')
                .text('Tonnes of CO₂ Equivalent');
        });
    }

    // Load sector data separately
    d3.csv('data/net-generation-over-time-by-sector.csv').then(function(data) {
        // Process the data
        const years = [...new Set(data.map(d => d.Year))].sort();
        const sources = [...new Set(data.map(d => d['Type of Energy Source']))];
        
        // Create container for all charts
        const chartsContainer = d3.select('.vis_net-generation-by-sector')
            .append('div')
            .style('width', '100%')
            .style('height', '100%')
            .style('position', 'relative')
            .style('overflow', 'hidden');

        // Set fixed maximum value
        const maxValue = 4000000; // Changed from 2400000 to 4000000

        // After the maxValue constant, add a color function
        const getBarColor = (source) => {
            // Total categories
            if (source === 'Total Renewable') return '#006400';  // Dark green
            if (source === 'Total Non-Renewable') return '#8B0000';  // Dark red
            
            // Find the corresponding data row to check if it's renewable
            const sourceData = data.find(d => d['Type of Energy Source'] === source);
            if (sourceData) {
                return sourceData.Renewable === 'Renewable' ? '#5B8A72' : '#B47676';  // Forest green : Muted red
            }
            return '#2171b5';  // Default color if type cannot be determined
        };

        // After the data loading and before the years.forEach
        let currentYearData = null;
        let currentSvg = null;

        // Create a single SVG that will be reused
        const mainSvg = chartsContainer.append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', chartHeight)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Add vertical year label on the left
        const yearLabel = mainSvg.append('text')
            .attr('x', -margin.left + 35)
            .attr('y', chartHeight / 2)
            .attr('text-anchor', 'middle')
            .attr('transform', `rotate(-90, ${-margin.left + 35}, ${chartHeight / 2})`)
            .style('font-size', '24px')
            .style('font-weight', 'bold')
            .style('fill', 'rgba(246, 240, 237, 0.8)');

        // Set up scales (will be reused)
        const y = d3.scaleBand()
            .range([0, chartHeight - margin.top - margin.bottom])
            .padding(0.3);

        const x = d3.scaleLinear()
            .domain([0, maxValue])
            .range([0, width]);

        // Add background grid lines
        // Vertical grid lines
        mainSvg.append('g')
            .attr('class', 'grid')
            .attr('opacity', 0.1)
            .call(d3.axisBottom(x)
                .tickSize(chartHeight - margin.top - margin.bottom)
                .tickFormat('')
            )
            .attr('transform', `translate(0,0)`)
            .selectAll('line')
            .style('stroke', '#F6F0ED');

        // Remove the domain line that comes with the grid
        mainSvg.selectAll('.grid path').remove();

        // Add the x-axis with ticks and labels
        mainSvg.append('g')
            .attr('transform', `translate(0,${chartHeight - margin.top - margin.bottom})`)
            .call(d3.axisBottom(x)
                .tickFormat(d3.format('.2s'))
                .ticks(10))
            .selectAll('text, line')
            .style('stroke', 'rgba(246, 240, 237, 0.8)')
            .style('fill', 'rgba(246, 240, 237, 0.8)');

        // Function to update the visualization for a given year
        function updateVisualization(year) {
            // Update year label
            yearLabel.text(year);

            const yearData = sources.map(source => {
                const entry = data.find(d => d.Year === year && d['Type of Energy Source'] === source);
                return {
                    source: source,
                    value: entry ? +entry['Amount Generated (thousand megawatthours)'] || 0 : 0
                };
            }).filter(d => d.value > 10000)
            .sort((a, b) => {
                if (a.source.startsWith('Total') && !b.source.startsWith('Total')) return -1;
                if (!a.source.startsWith('Total') && b.source.startsWith('Total')) return 1;
                if (a.source.startsWith('Total') && b.source.startsWith('Total')) {
                    return a.source.includes('Non-Renewable') ? -1 : 1;
                }
                return b.value - a.value;
            });

            // Fixed height calculations
            const availableHeight = chartHeight - margin.top - margin.bottom;
            const maxBars = 12; // Adjust based on typical number of visible bars
            const barHeight = Math.floor((availableHeight - margin.top - margin.bottom) / maxBars);
            
            // Update y scale with fixed range
            y.range([0, availableHeight - margin.top - margin.bottom])
             .padding(0.2)
             .domain(yearData.map(d => d.source));

            // Update bars with smoother transitions
            const bars = mainSvg.selectAll('rect')
                .data(yearData, d => d.source);

            // ENTER new bars
            const barsEnter = bars.enter()
                .append('rect')
                .attr('y', d => y(d.source))
                .attr('x', 0)
                .attr('height', barHeight)
                .attr('fill', d => getBarColor(d.source))
                .attr('opacity', 0.8)
                .attr('width', 0);

            // UPDATE + ENTER
            bars.merge(barsEnter)
                .transition()
                .duration(750)
                .ease(d3.easeQuadInOut)  // Smoother easing function
                .attr('y', d => y(d.source))
                .attr('width', d => x(d.value))
                .attr('height', barHeight);

            // EXIT
            bars.exit()
                .transition()
                .duration(750)
                .ease(d3.easeQuadInOut)
                .attr('width', 0)
                .remove();

            // Update labels with smoother transitions
            const sourceLabels = mainSvg.selectAll('.source-label')
                .data(yearData, d => d.source);

            // ENTER source labels
            const sourceLabelsEnter = sourceLabels.enter()
                .append('text')
                .attr('class', 'source-label')
                .attr('x', -10)
                .attr('y', d => y(d.source) + barHeight/2)
                .attr('dy', '0.35em')
                .attr('text-anchor', 'end')
                .style('font-size', '12px')
                .style('fill', 'rgba(246, 240, 237, 0.8)')
                .style('opacity', 0)
                .text(d => d.source);

            // UPDATE + ENTER source labels
            sourceLabels.merge(sourceLabelsEnter)
                .transition()
                .duration(750)
                .ease(d3.easeQuadInOut)
                .style('opacity', 1)
                .attr('y', d => y(d.source) + barHeight/2)
                .text(d => d.source);

            // EXIT source labels
            sourceLabels.exit()
                .transition()
                .duration(750)
                .ease(d3.easeQuadInOut)
                .style('opacity', 0)
                .remove();

            // Update value labels with smoother transitions
            const valueLabels = mainSvg.selectAll('.value-label')
                .data(yearData, d => d.source);

            // ENTER value labels
            const valueLabelsEnter = valueLabels.enter()
                .append('text')
                .attr('class', 'value-label')
                .attr('x', d => x(d.value) + 5)
                .attr('y', d => y(d.source) + barHeight/2)
                .attr('dy', '0.35em')
                .style('font-size', '12px')
                .style('fill', 'rgba(246, 240, 237, 0.8)')
                .style('opacity', 0);

            // UPDATE + ENTER value labels
            valueLabels.merge(valueLabelsEnter)
                .transition()
                .duration(750)
                .ease(d3.easeQuadInOut)
                .style('opacity', 1)
                .attr('x', d => x(d.value) + 5)
                .attr('y', d => y(d.source) + barHeight/2)
                .tween('text', function(d) {
                    const i = d3.interpolate(this._current || 0, d.value);
                    this._current = d.value;
                    return function(t) {
                        this.textContent = d3.format('.2s')(i(t));
                    };
                });

            // EXIT value labels
            valueLabels.exit()
                .transition()
                .duration(750)
                .ease(d3.easeQuadInOut)
                .style('opacity', 0)
                .remove();
        }

        // Create a separate div for the year scroll
        const yearScrollContainer = chartsContainer.append('div')
            .style('position', 'absolute')
            .style('top', '0')
            .style('left', '0')
            .style('width', '100%')
            .style('height', '100%')
            .style('overflow-y', 'scroll')
            .style('pointer-events', 'auto')
            .style('opacity', '0') // Make it invisible but scrollable
            .style('scrollbar-width', 'none') // Firefox
            .style('-ms-overflow-style', 'none') // IE and Edge
            .style('overflow', '-moz-scrollbars-none') // Old Firefox
            .style('&::-webkit-scrollbar', 'display: none'); // Chrome, Safari, Opera

        // Add webkit scrollbar style directly to document head
        const style = document.createElement('style');
        style.textContent = `
            .vis_net-generation-by-sector div::-webkit-scrollbar {
                display: none;
            }
        `;
        document.head.appendChild(style);

        // Add empty divs for scroll height to the year scroll container
        const scrollHeight = years.length * 100; // 100px per year
        yearScrollContainer.append('div')
            .style('height', scrollHeight + 'px')
            .style('width', '1px');

        // Modify the scroll event listener to prevent overflow at the end
        let lastScrollTop = 0;
        const scrollThreshold = 50; // Add a threshold to control scroll sensitivity

        yearScrollContainer.node().addEventListener('scroll', function() {
            const scrollTop = this.scrollTop;
            const containerHeight = this.clientHeight;
            const scrollHeight = this.scrollHeight - containerHeight;
            
            // Calculate which year to show based on scroll position
            const scrollProgress = Math.min(0.999, Math.max(0, scrollTop / scrollHeight));
            const yearIndex = Math.min(
                years.length - 1,
                Math.floor(scrollProgress * years.length)
            );
            
            const currentYear = years[yearIndex];
            if (currentYear !== lastScrollTop) {
                updateVisualization(currentYear);
                updateYearIndicators(currentYear);
                lastScrollTop = currentYear;
            }
        });

        // Initialize visualization and indicators with first year
        createLineCharts();
        setTimeout(() => {
            updateVisualization(years[0]);
            updateYearIndicators(years[0]);
        }, 100); // Small delay to ensure data is loaded

        // Add separator line
        mainSvg.append('line')
            .attr('x1', -margin.left)
            .attr('x2', width + margin.right)
            .attr('y1', chartHeight - margin.top - margin.bottom + 10)
            .attr('y2', chartHeight - margin.top - margin.bottom + 10)
            .style('stroke', '#F6F0ED')
            .style('stroke-width', '1px');

        // After creating chartsContainer, add the sticky header container
        chartsContainer.insert('div', ':first-child')
            .attr('class', 'sticky-header')
            .style('position', 'sticky')
            .style('top', '0')
            .style('background-color', '#2A2B2E')
            .style('z-index', '1000')
            .style('padding-bottom', '0px')
            .call(div => {
                // Add title for the measurement unit
                div.append('div')
                    .style('text-align', 'center')
                    .style('padding', '10px')
                    .style('font-weight', 'bold')
                    .style('color', 'rgba(246, 240, 237, 0.8)')
                    .text('Energy Generated (thousand megawatthours)');

                // Add SVG for the x-axis
                const axisSvg = div.append('svg')
                    .attr('width', width + margin.left + margin.right)
                    .attr('height', 40)  // Increased height for labels
                    .append('g')
                    .attr('transform', `translate(${margin.left},0)`);

                const x = d3.scaleLinear()
                    .domain([0, maxValue])
                    .range([0, width]);

                // Add gridlines with labels
                const tickValues = x.ticks(10);
                
                // Add gridlines
                axisSvg.selectAll('line.grid')
                    .data(tickValues)
                    .join('line')
                    .attr('class', 'grid')
                    .attr('x1', d => x(d))
                    .attr('x2', d => x(d))
                    .attr('y1', 0)
                    .attr('y2', 10)  // Extended line length
                    .style('stroke', 'rgba(246, 240, 237, 0.8)')
                    .style('stroke-width', '1px');

                // Add measurement labels
                axisSvg.selectAll('.tick-label')
                    .data(tickValues)
                    .join('text')
                    .attr('class', 'tick-label')
                    .attr('x', d => x(d))
                    .attr('y', 25)  // Position below the gridlines
                    .attr('text-anchor', 'middle')
                    .style('font-size', '10px')
                    .style('fill', 'rgba(246, 240, 237, 0.8)')
                    .text(d => d3.format('.2s')(d));

                const xAxis = d3.axisTop(x)
                    .tickFormat(d => d3.format('.2s')(d))
                    .ticks(10);
                
                axisSvg.append('g')
                    .call(xAxis)
                    .selectAll('text, line, path')
                    .style('stroke', 'rgba(246, 240, 237, 0.8)')
                    .style('fill', 'rgba(246, 240, 237, 0.8)');
            });

        // After creating chartsContainer, add a variable to track current visible year
        let currentVisibleYear = years[0]; // Initialize with first year

        // Call createLineCharts after SVG setup
        createLineCharts();

        // Add scroll event listener to the bar chart container
        d3.select('.vis_net-generation-by-sector').on('scroll', function() {
            // Get all year charts
            const yearCharts = document.querySelectorAll('.vis_net-generation-by-sector svg');
            
            // Find which year chart is most visible
            let maxVisibility = 0;
            let mostVisibleYear = currentVisibleYear;
            
            yearCharts.forEach((chart) => {
                const rect = chart.getBoundingClientRect();
                const visibility = getVisibility(rect);
                
                if (visibility > maxVisibility) {
                    maxVisibility = visibility;
                    // Extract year from the text element
                    const yearText = chart.querySelector('text').textContent;
                    mostVisibleYear = +yearText;
                }
            });
            
            if (mostVisibleYear !== currentVisibleYear) {
                currentVisibleYear = mostVisibleYear;
                updateYearIndicators(currentVisibleYear);
            }
        });

        // Helper function to calculate visibility
        function getVisibility(rect) {
            const containerRect = document.querySelector('.vis_net-generation-by-sector').getBoundingClientRect();
            const visibleTop = Math.max(rect.top, containerRect.top);
            const visibleBottom = Math.min(rect.bottom, containerRect.bottom);
            return Math.max(0, visibleBottom - visibleTop);
        }

        // Function to update year indicators
        function updateYearIndicators(year) {
            // Update counter
            if (totalGenData && carbonData) {
                const totalGenEntry = totalGenData.find(d => d.Year === year.toString() && d.Class === 'Total');
                const carbonEntry = carbonData.find(d => +d.Year === year);
                
                const totalGenValue = totalGenEntry ? +totalGenEntry['Amount Generated (thousand megawatthours)'] : 0;
                const carbonValue = carbonEntry ? +carbonEntry['tonnes of carbon dioxide-equivalents'] : 0;

                // Update counter display
                const counterContainer = d3.select('.vis_counter');
                
                // Create counter content if it doesn't exist
                const counterContent = counterContainer.selectAll('.counter-content')
                    .data([1])
                    .join('div')
                    .attr('class', 'counter-content')
                    .style('color', 'rgba(246, 240, 237, 0.8)')
                    .style('padding', '10px')
                    .style('text-align', 'center');

                counterContent.html(`
                    <div style="font-size: 1.2em; margin-bottom: 5px;">Year: ${year}</div>
                    <div style="margin-bottom: 5px;">Total Generation: ${d3.format('.3s')(totalGenValue)} MWh</div>
                    <div>Carbon Emissions: ${d3.format('.3s')(carbonValue)} tonnes CO₂</div>
                `);
            }

            // Update line indicators if scales are available
            if (xScale && totalGenSvg) {
                const totalGenX = xScale(+year);
                totalGenSvg.selectAll('.year-indicator').remove();
                totalGenSvg.append('line')
                    .attr('class', 'year-indicator')
                    .attr('x1', totalGenX)
                    .attr('x2', totalGenX)
                    .attr('y1', 0)
                    .attr('y2', totalGenHeight)
                    .style('stroke', 'rgba(246, 240, 237, 0.8)')
                    .style('stroke-width', '1px')
                    .style('stroke-dasharray', '4,4');
            }

            if (carbonXScale && carbonSvg) {
                const carbonX = carbonXScale(+year);
                carbonSvg.selectAll('.year-indicator').remove();
                carbonSvg.append('line')
                    .attr('class', 'year-indicator')
                    .attr('x1', carbonX)
                    .attr('x2', carbonX)
                    .attr('y1', 0)
                    .attr('y2', carbonHeight)
                    .style('stroke', 'rgba(246, 240, 237, 0.8)')
                    .style('stroke-width', '1px')
                    .style('stroke-dasharray', '4,4');
            }
        }

        // Keep these global variables and counter function
        let totalGenData, carbonData;
    });
};
