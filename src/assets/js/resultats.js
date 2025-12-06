(function() {
	'use strict';

	var container = document.getElementById('resultats-container');
	var countEl = document.getElementById('results-count');
	var statsEl = document.getElementById('results-stats');
	var filterYear = document.getElementById('filter-year');
	var filterCircuit = document.getElementById('filter-circuit');
	var filterCompetition = document.getElementById('filter-competition');
	var filterCategorie = document.getElementById('filter-categorie');
	var filterPodium = document.getElementById('filter-podium');
	var filterReset = document.getElementById('filter-reset');
	var expandAllBtn = document.getElementById('expand-all');

	if (!container) return;

	var allExpanded = false;

	var allData = null;
	var groupedByYear = {};

	var moisFR = ['jan.', 'fév.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

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

	// Formater une date ISO en français
	function formatDate(dateDebut, dateFin) {
		if (!dateDebut) return '';
		var d1 = new Date(dateDebut);
		var jour1 = d1.getDate();
		var mois1 = d1.getMonth();

		if (!dateFin) {
			return jour1 + ' ' + moisFR[mois1];
		}

		var d2 = new Date(dateFin);
		var jour2 = d2.getDate();
		var mois2 = d2.getMonth();

		if (mois1 === mois2) {
			return jour1 + '-' + jour2 + ' ' + moisFR[mois1];
		}
		return jour1 + ' ' + moisFR[mois1] + ' - ' + jour2 + ' ' + moisFR[mois2];
	}

	// Extraire l'année d'une date ISO
	function getYear(dateStr) {
		if (!dateStr) return null;
		return parseInt(dateStr.substring(0, 4), 10);
	}

	// Emoji podium
	function addPodiumEmoji(val) {
		var valLower = val.toLowerCase();
		if (valLower.indexOf('1er') !== -1 || valLower.indexOf('vainqueur') !== -1 || valLower === 'champion') {
			return '🥇 ' + val;
		} else if (valLower.indexOf('2ème') !== -1 || valLower === 'vice-champion') {
			return '🥈 ' + val;
		} else if (valLower.indexOf('3ème') !== -1) {
			return '🥉 ' + val;
		}
		return val;
	}

	function getPodiumEmoji(result) {
		var resultLower = (result || '').toLowerCase();
		if (resultLower.indexOf('1er') !== -1 || resultLower.indexOf('vainqueur') !== -1 || resultLower === 'champion') {
			return '🥇 ';
		} else if (resultLower.indexOf('2ème') !== -1 || resultLower === 'vice-champion') {
			return '🥈 ';
		} else if (resultLower.indexOf('3ème') !== -1) {
			return '🥉 ';
		}
		return '';
	}

	function isVictoire(result) {
		var r = (result || '').toLowerCase();
		return r.indexOf('1er') !== -1 || r.indexOf('vainqueur') !== -1 || r === 'champion';
	}

	// Détecter les colonnes à afficher pour une liste de courses
	function detectColumns(courses, includeCompetition) {
		var cols = ['date'];
		if (includeCompetition) cols.push('competition');
		cols.push('circuit');

		var hasCat = courses.some(function(c) { return c.categorie; });
		if (hasCat) cols.push('categorie');

		var hasCumul = courses.some(function(c) { return c.cumul; });
		if (hasCumul) cols.push('cumul');

		var hasPrefinale = courses.some(function(c) { return c.prefinale; });
		if (hasPrefinale) cols.push('prefinale');

		var hasFinale = courses.some(function(c) { return c.finale; });
		var hasResultat = courses.some(function(c) { return c.resultat; });

		if (hasFinale) cols.push('finale');
		else if (hasResultat) cols.push('resultat');

		return cols;
	}

	// Rendu des lignes de courses
	function renderCourseRows(coursesList, colsList) {
		var rowsHtml = '';
		coursesList.forEach(function(course) {
			var rowClass = course.podium ? ' class="result-podium"' : '';
			rowsHtml += '<tr' + rowClass + '>';
			colsList.forEach(function(col) {
				var val = '';
				if (col === 'date') {
					val = formatDate(course.dateDebut, course.dateFin);
				} else {
					val = course[col] || '';
				}
				if (col === 'circuit' && course.manche) {
					val = val ? val + ' ' + course.manche : course.manche;
				}
				var isPodiumCol = course.podium && (col === 'finale' || col === 'resultat');
				if (isPodiumCol && val) {
					val = addPodiumEmoji(val);
				}
				var cellClass = isPodiumCol ? ' class="result-highlight"' : '';
				rowsHtml += '<td' + cellClass + '>' + val + '</td>';
			});
			rowsHtml += '</tr>';
		});
		return rowsHtml;
	}

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

			document.querySelectorAll('.season-btn').forEach(function(b) {
				b.classList.remove('active');
				b.setAttribute('aria-expanded', 'false');
				if (b.nextElementSibling) {
					b.nextElementSibling.classList.remove('active');
				}
			});

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
		} else {
			var html = '';

			// Afficher les championnats
			if (season.championnats && season.championnats.length > 0) {
				season.championnats.forEach(function(champ) {
					var emoji = champ.podium ? getPodiumEmoji(champ.resultat) : '';
					var podiumClass = champ.podium ? ' classement-podium' : '';

					html += '<div class="competition-block">';
					html += '<div class="classement-header' + podiumClass + '">';
					html += '<span class="classement-competition">' + champ.nom + '</span>';
					html += '<span class="classement-categorie">' + champ.categorie + '</span>';
					html += '<span class="classement-result">' + emoji + champ.resultat + '</span>';
					html += '</div>';

					if (champ.courses && champ.courses.length > 0) {
						var cols = detectColumns(champ.courses, false);
						html += '<div class="table-container"><table><thead><tr>';
						cols.forEach(function(col) {
							html += '<th>' + (columnLabels[col] || col) + '</th>';
						});
						html += '</tr></thead><tbody>';
						html += renderCourseRows(champ.courses, cols);
						html += '</tbody></table></div>';
					}
					html += '</div>';
				});
			}

			// Afficher les autres courses
			if (season.courses && season.courses.length > 0) {
				var hasInternational = season.courses.some(function(c) {
					var comp = (c.competition || '').toLowerCase();
					return comp.indexOf('monde') !== -1 || comp.indexOf('world') !== -1;
				});
				var autresLabel = hasInternational ? 'Épreuves nationales et internationales' : 'Épreuves nationales';
				var cols = detectColumns(season.courses, true);

				html += '<div class="competition-block autres-courses">';
				html += '<div class="classement-header autres-header">';
				html += '<span class="classement-competition">' + autresLabel + '</span>';
				html += '</div>';
				html += '<div class="table-container"><table><thead><tr>';
				cols.forEach(function(col) {
					html += '<th>' + (columnLabels[col] || col) + '</th>';
				});
				html += '</tr></thead><tbody>';
				html += renderCourseRows(season.courses, cols);
				html += '</tbody></table></div>';
				html += '</div>';
			}

			content.innerHTML = html;
		}

		accordion.appendChild(btn);
		accordion.appendChild(content);
		return accordion;
	}

	// Grouper les données par année
	function groupByYear(data) {
		var byYear = {};
		var years = new Set();

		// Championnats
		data.championnats.forEach(function(champ) {
			var year = champ.annee;
			if (!year && champ.courses && champ.courses.length > 0) {
				year = getYear(champ.courses[0].dateDebut);
			}
			if (year) {
				years.add(year);
				if (!byYear[year]) byYear[year] = { championnats: [], courses: [] };
				byYear[year].championnats.push(champ);
			}
		});

		// Courses individuelles
		data.courses.forEach(function(course) {
			var year = getYear(course.dateDebut);
			if (year) {
				years.add(year);
				if (!byYear[year]) byYear[year] = { championnats: [], courses: [] };
				byYear[year].courses.push(course);
			}
		});

		// Infos
		if (data.infos) {
			Object.keys(data.infos).forEach(function(y) {
				var year = parseInt(y, 10);
				years.add(year);
				if (!byYear[year]) byYear[year] = { championnats: [], courses: [], info: data.infos[y] };
				else byYear[year].info = data.infos[y];
			});
		}

		// Trier les courses par date dans chaque année
		Object.keys(byYear).forEach(function(year) {
			byYear[year].championnats.forEach(function(champ) {
				if (champ.courses && champ.courses.length > 1) {
					champ.courses.sort(function(a, b) {
						return (a.dateDebut || '').localeCompare(b.dateDebut || '');
					});
				}
			});
			if (byYear[year].courses.length > 1) {
				byYear[year].courses.sort(function(a, b) {
					return (a.dateDebut || '').localeCompare(b.dateDebut || '');
				});
			}
		});

		return { byYear: byYear, years: Array.from(years).sort(function(a, b) { return b - a; }) };
	}

	function extractAndPopulateFilters(data, years) {
		var circuits = new Set();
		var competitions = new Set();
		var categories = new Set();

		data.championnats.forEach(function(champ) {
			competitions.add(champ.nom);
			categories.add(champ.categorie);
			if (champ.courses) {
				champ.courses.forEach(function(c) {
					if (c.circuit) circuits.add(c.circuit);
					if (c.categorie) categories.add(c.categorie);
				});
			}
		});

		data.courses.forEach(function(c) {
			if (c.circuit) circuits.add(c.circuit);
			if (c.competition) competitions.add(c.competition);
			if (c.categorie) categories.add(c.categorie);
		});

		// Années
		years.forEach(function(year) {
			var opt = document.createElement('option');
			opt.value = year;
			opt.textContent = year;
			filterYear.appendChild(opt);
		});

		// Circuits triés
		Array.from(circuits).sort().forEach(function(v) {
			var opt = document.createElement('option');
			opt.value = v;
			opt.textContent = v;
			filterCircuit.appendChild(opt);
		});

		// Compétitions triées
		Array.from(competitions).sort().forEach(function(v) {
			var opt = document.createElement('option');
			opt.value = v;
			opt.textContent = v;
			filterCompetition.appendChild(opt);
		});

		// Catégories triées
		if (filterCategorie) {
			Array.from(categories).sort().forEach(function(v) {
				var opt = document.createElement('option');
				opt.value = v;
				opt.textContent = v;
				filterCategorie.appendChild(opt);
			});
		}
	}

	function computeAndRenderStats(data) {
		if (!statsEl) return;

		var totalCourses = 0;
		var totalPodiums = 0;
		var totalVictoires = 0;
		var circuits = new Set();
		var yearsWithCourses = new Set();

		data.championnats.forEach(function(champ) {
			if (champ.courses) {
				champ.courses.forEach(function(c) {
					totalCourses++;
					if (c.circuit) circuits.add(c.circuit);
					var year = getYear(c.dateDebut);
					if (year) yearsWithCourses.add(year);
					if (c.podium) {
						totalPodiums++;
						if (isVictoire(c.finale || c.resultat)) totalVictoires++;
					}
				});
			}
		});

		data.courses.forEach(function(c) {
			totalCourses++;
			if (c.circuit) circuits.add(c.circuit);
			var year = getYear(c.dateDebut);
			if (year) yearsWithCourses.add(year);
			if (c.podium) {
				totalPodiums++;
				if (isVictoire(c.finale || c.resultat)) totalVictoires++;
			}
		});

		statsEl.innerHTML = '<div class="stats-grid">' +
			'<div class="stat-item"><span class="stat-value">' + yearsWithCourses.size + '</span><span class="stat-label">Saisons</span></div>' +
			'<div class="stat-item"><span class="stat-value">' + totalCourses + '</span><span class="stat-label">Courses</span></div>' +
			'<div class="stat-item"><span class="stat-value">' + totalPodiums + '</span><span class="stat-label">Podiums</span></div>' +
			'<div class="stat-item"><span class="stat-value">' + totalVictoires + '</span><span class="stat-label">Victoires</span></div>' +
			'<div class="stat-item"><span class="stat-value">' + circuits.size + '</span><span class="stat-label">Circuits</span></div>' +
			'</div>';
	}

	function matchesCourse(course, filters) {
		if (filters.circuit && course.circuit !== filters.circuit) return false;
		if (filters.categorie && course.categorie !== filters.categorie) return false;
		if (filters.podium && !course.podium) return false;
		return true;
	}

	function matchesCompetition(name, filter) {
		return !filter || name === filter || name.indexOf(filter) !== -1;
	}

	function applyFilters() {
		var yearVal = filterYear.value;
		var circuitVal = filterCircuit.value;
		var competitionVal = filterCompetition.value;
		var categorieVal = filterCategorie ? filterCategorie.value : '';
		var podiumVal = filterPodium.value === 'true';

		var filters = {
			circuit: circuitVal,
			categorie: categorieVal,
			podium: podiumVal
		};

		var filteredSeasons = [];
		var totalRaces = 0;
		var totalPodiums = 0;

		var yearsToShow = yearVal ? [parseInt(yearVal, 10)] : groupedByYear.years;

		yearsToShow.forEach(function(year) {
			var seasonData = groupedByYear.byYear[year];
			if (!seasonData) return;

			var filteredSeason = {
				annee: year,
				info: seasonData.info,
				championnats: [],
				courses: []
			};

			// Filtrer les championnats
			seasonData.championnats.forEach(function(champ) {
				var matchesComp = matchesCompetition(champ.nom, competitionVal);
				var matchesCat = !categorieVal || champ.categorie === categorieVal;
				var matchesPod = !podiumVal || champ.podium;

				if (matchesComp && matchesCat) {
					var filteredChamp = {
						nom: champ.nom,
						categorie: champ.categorie,
						resultat: champ.resultat,
						podium: champ.podium,
						courses: []
					};

					if (champ.courses) {
						champ.courses.forEach(function(course) {
							if (matchesCourse(course, filters)) {
								filteredChamp.courses.push(course);
								totalRaces++;
								if (course.podium) totalPodiums++;
							}
						});
					}

					if (filteredChamp.courses.length > 0 || (matchesPod && !circuitVal)) {
						filteredSeason.championnats.push(filteredChamp);
					}
				}
			});

			// Filtrer les courses hors championnat
			seasonData.courses.forEach(function(course) {
				var matchesComp = matchesCompetition(course.competition, competitionVal);
				if (matchesComp && matchesCourse(course, filters)) {
					filteredSeason.courses.push(course);
					totalRaces++;
					if (course.podium) totalPodiums++;
				}
			});

			var hasActiveFilters = circuitVal || competitionVal || categorieVal || podiumVal;
			var hasContent = filteredSeason.championnats.length > 0 || filteredSeason.courses.length > 0;
			if (hasContent || (filteredSeason.info && !hasActiveFilters)) {
				filteredSeasons.push(filteredSeason);
			}
		});

		renderResults(filteredSeasons, yearVal !== '');
		updateCount(totalRaces, totalPodiums);

		// Réinitialiser l'état du bouton expand
		allExpanded = false;
		if (expandAllBtn) {
			var icon = expandAllBtn.querySelector('.expand-icon');
			var text = expandAllBtn.querySelector('.expand-text');
			icon.textContent = '+';
			text.textContent = 'Tout déplier';
		}
	}

	function updateCount(races, podiums) {
		if (races > 0) {
			countEl.innerHTML = '<strong>' + races + '</strong> course(s) trouvée(s) dont <strong>' + podiums + '</strong> podium(s)';
		} else {
			countEl.innerHTML = 'Aucune course trouvée avec ces filtres';
		}
	}

	function renderResults(seasons, openFirst) {
		container.innerHTML = '';

		if (seasons && seasons.length > 0) {
			seasons.forEach(function(season, index) {
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
		if (filterCategorie) filterCategorie.value = '';
		filterPodium.value = '';
		applyFilters();
	}

	function toggleAllSeasons() {
		var buttons = document.querySelectorAll('.season-btn');
		var contents = document.querySelectorAll('.season-content');

		allExpanded = !allExpanded;

		buttons.forEach(function(btn) {
			if (allExpanded) {
				btn.classList.add('active');
				btn.setAttribute('aria-expanded', 'true');
			} else {
				btn.classList.remove('active');
				btn.setAttribute('aria-expanded', 'false');
			}
		});

		contents.forEach(function(content) {
			if (allExpanded) {
				content.classList.add('active');
			} else {
				content.classList.remove('active');
			}
		});

		// Mettre à jour le bouton
		if (expandAllBtn) {
			var icon = expandAllBtn.querySelector('.expand-icon');
			var text = expandAllBtn.querySelector('.expand-text');
			if (allExpanded) {
				icon.textContent = '−';
				text.textContent = 'Tout replier';
			} else {
				icon.textContent = '+';
				text.textContent = 'Tout déplier';
			}
		}
	}

	// Event listeners
	if (filterYear) filterYear.addEventListener('change', applyFilters);
	if (filterCircuit) filterCircuit.addEventListener('change', applyFilters);
	if (filterCompetition) filterCompetition.addEventListener('change', applyFilters);
	if (filterCategorie) filterCategorie.addEventListener('change', applyFilters);
	if (filterPodium) filterPodium.addEventListener('change', applyFilters);
	if (filterReset) filterReset.addEventListener('click', resetFilters);
	if (expandAllBtn) expandAllBtn.addEventListener('click', toggleAllSeasons);

	// Fetch data
	fetch('/data/resultats.json')
		.then(function(res) {
			if (!res.ok) throw new Error('Erreur de chargement');
			return res.json();
		})
		.then(function(data) {
			allData = data;
			var grouped = groupByYear(data);
			groupedByYear = grouped;
			extractAndPopulateFilters(data, grouped.years);
			computeAndRenderStats(data);
			applyFilters();
		})
		.catch(function(err) {
			console.error('Erreur:', err);
			container.innerHTML = '<p>Erreur lors du chargement des résultats.</p>';
		});
})();
