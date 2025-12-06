(function() {
	'use strict';

	var container = document.getElementById('resultats-container');
	var countEl = document.getElementById('results-count');
	var filterYear = document.getElementById('filter-year');
	var filterCircuit = document.getElementById('filter-circuit');
	var filterCompetition = document.getElementById('filter-competition');
	var filterPodium = document.getElementById('filter-podium');
	var filterReset = document.getElementById('filter-reset');

	if (!container) return;

	var allData = null;
	var allCircuits = new Set();
	var allCompetitions = new Set();

	var columnLabels = {
		date: 'Date',
		competition: 'Compétition',
		circuit: 'Circuit',
		categorie: 'Catégorie',
		cumul: 'Cumul',
		prefinale: 'Pré-Finale',
		finale: 'Finale',
		resultat: 'Résultat'
	};

	var defaultColumns = ['date', 'competition', 'circuit', 'categorie', 'prefinale', 'finale'];

	function createSeasonAccordion(season, isFiltered) {
		var year = season.annee;
		var accordion = document.createElement('div');
		accordion.className = 'season-accordion';

		var btn = document.createElement('button');
		btn.className = 'season-btn';
		if (isFiltered) btn.classList.add('active');
		btn.textContent = 'Saison ' + year;
		btn.setAttribute('aria-expanded', isFiltered ? 'true' : 'false');

		btn.addEventListener('click', function() {
			var content = this.nextElementSibling;
			var isActive = this.classList.contains('active');

			// Close all others
			document.querySelectorAll('.season-btn').forEach(function(b) {
				b.classList.remove('active');
				b.setAttribute('aria-expanded', 'false');
				if (b.nextElementSibling) {
					b.nextElementSibling.classList.remove('active');
				}
			});

			// Toggle current
			if (!isActive) {
				this.classList.add('active');
				this.setAttribute('aria-expanded', 'true');
				if (content) content.classList.add('active');
			}
		});

		var content = document.createElement('div');
		content.className = 'season-content' + (isFiltered ? ' active' : '');

		if (season.info) {
			content.innerHTML = '<div class="table-container"><p style="padding: 1rem; color: var(--color-text-muted);">' + season.info + '</p></div>';
		} else if (season.courses && season.courses.length > 0) {
			var cols = season.colonnes || defaultColumns;
			var html = '<div class="table-container"><table><thead><tr>';

			cols.forEach(function(col) {
				html += '<th>' + (columnLabels[col] || col) + '</th>';
			});
			html += '</tr></thead><tbody>';

			season.courses.forEach(function(course) {
				var rowClass = course.podium ? ' class="result-podium"' : '';
				html += '<tr' + rowClass + '>';
				cols.forEach(function(col) {
					var val = course[col] || '';
					var isPodiumCol = course.podium && (col === 'finale' || col === 'resultat');
					var cellClass = isPodiumCol ? ' class="result-highlight"' : '';
					html += '<td' + cellClass + '>' + val + '</td>';
				});
				html += '</tr>';
			});
			html += '</tbody></table></div>';
			content.innerHTML = html;
		}

		accordion.appendChild(btn);
		accordion.appendChild(content);
		return accordion;
	}

	function extractFiltersData(data) {
		data.saisons.forEach(function(season) {
			if (season.courses) {
				season.courses.forEach(function(course) {
					if (course.circuit) allCircuits.add(course.circuit);
					if (course.competition) allCompetitions.add(course.competition);
				});
			}
		});

		// Populate year filter
		data.saisons.forEach(function(season) {
			var opt = document.createElement('option');
			opt.value = season.annee;
			opt.textContent = season.annee;
			filterYear.appendChild(opt);
		});

		// Populate circuit filter
		Array.from(allCircuits).sort().forEach(function(circuit) {
			var opt = document.createElement('option');
			opt.value = circuit;
			opt.textContent = circuit;
			filterCircuit.appendChild(opt);
		});

		// Populate competition filter
		Array.from(allCompetitions).sort().forEach(function(comp) {
			var opt = document.createElement('option');
			opt.value = comp;
			opt.textContent = comp;
			filterCompetition.appendChild(opt);
		});
	}

	function applyFilters() {
		var yearVal = filterYear.value;
		var circuitVal = filterCircuit.value;
		var competitionVal = filterCompetition.value;
		var podiumVal = filterPodium.value;

		var filteredData = {
			saisons: []
		};

		var totalRaces = 0;
		var totalPodiums = 0;

		allData.saisons.forEach(function(season) {
			// Year filter
			if (yearVal && season.annee != yearVal) return;

			var filteredSeason = {
				annee: season.annee,
				colonnes: season.colonnes,
				info: season.info,
				courses: []
			};

			if (season.courses) {
				season.courses.forEach(function(course) {
					// Circuit filter
					if (circuitVal && course.circuit !== circuitVal) return;
					// Competition filter
					if (competitionVal && course.competition !== competitionVal) return;
					// Podium filter
					if (podiumVal === 'true' && !course.podium) return;

					filteredSeason.courses.push(course);
					totalRaces++;
					if (course.podium) totalPodiums++;
				});
			}

			if (filteredSeason.courses.length > 0 || filteredSeason.info) {
				filteredData.saisons.push(filteredSeason);
			}
		});

		renderResults(filteredData, yearVal !== '');
		updateCount(totalRaces, totalPodiums);
	}

	function updateCount(races, podiums) {
		if (races > 0) {
			countEl.innerHTML = '<strong>' + races + '</strong> course(s) trouvée(s) dont <strong>' + podiums + '</strong> podium(s)';
		} else {
			countEl.innerHTML = 'Aucune course trouvée avec ces filtres';
		}
	}

	function renderResults(data, openFirst) {
		container.innerHTML = '';

		if (data.saisons && data.saisons.length > 0) {
			data.saisons.forEach(function(season, index) {
				var shouldOpen = openFirst && index === 0;
				container.appendChild(createSeasonAccordion(season, shouldOpen));
			});
		} else {
			container.innerHTML = '<p>Aucun résultat disponible avec ces filtres.</p>';
		}
	}

	function resetFilters() {
		filterYear.value = '';
		filterCircuit.value = '';
		filterCompetition.value = '';
		filterPodium.value = '';
		applyFilters();
	}

	// Event listeners
	if (filterYear) filterYear.addEventListener('change', applyFilters);
	if (filterCircuit) filterCircuit.addEventListener('change', applyFilters);
	if (filterCompetition) filterCompetition.addEventListener('change', applyFilters);
	if (filterPodium) filterPodium.addEventListener('change', applyFilters);
	if (filterReset) filterReset.addEventListener('click', resetFilters);

	// Fetch data
	fetch('/data/resultats.json')
		.then(function(res) {
			if (!res.ok) throw new Error('Erreur de chargement');
			return res.json();
		})
		.then(function(data) {
			allData = data;
			extractFiltersData(data);
			applyFilters();
		})
		.catch(function(err) {
			console.error('Erreur:', err);
			container.innerHTML = '<p>Erreur lors du chargement des résultats.</p>';
		});
})();
