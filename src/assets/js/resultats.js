(function() {
	'use strict';

	var container = document.getElementById('resultats-container');
	var countEl = document.getElementById('results-count');
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

	// Labels personnalisés pour les colonnes (les autres utilisent le nom de la clé avec majuscule)
	var columnLabels = {
		date: 'Date',
		circuit: 'Circuit',
		categorie: 'Catégorie',
		chrono: 'Chrono',
		m1: 'M1',
		m2: 'M2',
		m3: 'M3',
		cumul: 'Cumul',
		prefinale: 'Pré-Finale',
		'finale 1': 'Finale 1',
		'finale 2': 'Finale 2',
		'finale 3': 'Finale 3',
		finale: 'Finale',
		finaleB: 'Finale B'
	};

	// Ordre des colonnes (les colonnes non listées apparaissent avant finale)
	var columnOrder = [
		'date', 'circuit', 'categorie',
		'chrono', 'm1', 'm2', 'm3', 'cumul', 'prefinale',
		'finale 1', 'finale 2', 'finale 3', 'finale', 'finaleB'
	];

	// Colonnes à ignorer (métadonnées et colonnes affichées dans l'en-tête)
	var ignoredColumns = ['dateDebut', 'dateFin', 'manche', 'annee', 'nom', 'courses', 'competition', 'dnf', 'annulee', 'pays'];

	// Emoji drapeaux par code pays
	var countryFlags = {
		'FR': '🇫🇷',
		'IT': '🇮🇹',
		'DE': '🇩🇪',
		'BE': '🇧🇪',
		'ES': '🇪🇸',
		'GB': '🇬🇧',
		'NL': '🇳🇱',
		'PT': '🇵🇹'
	};

	// Convertir un code pays en emoji drapeau
	function getFlag(countryCode) {
		return countryFlags[countryCode] || '';
	}

	// Colonnes de position (à afficher avec badge Pvaleur)
	var positionColumns = ['chrono', 'cumul', 'prefinale', 'finale', 'finale 1', 'finale 2', 'finale 3', 'finaleB', 'm1', 'm2', 'm3'];

	// Générer un label pour une colonne
	function getColumnLabel(col) {
		if (columnLabels[col]) return columnLabels[col];
		// Capitaliser la première lettre
		return col.charAt(0).toUpperCase() + col.slice(1);
	}

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

	// Formater une position en badge Pvaleur
	function formatPosition(val) {
		if (!val) return '';
		var valLower = val.toLowerCase();

		// Valeurs spéciales sans badge
		if (valLower === 'dns' || valLower === 'dnf' || valLower === 'annulée' || val === '') {
			return val;
		}

		// 1er / vainqueur - badge or
		if (valLower === '1er' || valLower === 'vainqueur') {
			return '<span class="position-badge position-1">P1</span>';
		}

		// Valeur numérique ou commençant par un nombre
		var match = val.match(/^(\d+)/);
		if (match) {
			var num = match[1];
			var reste = val.substring(num.length).trim();
			var badgeClass = 'position-badge';
			var numInt = parseInt(num, 10);
			// Toujours colorer les positions 1, 2, 3
			if (numInt <= 3) {
				badgeClass += ' position-' + num;
			}
			var badge = '<span class="' + badgeClass + '">P' + num + '</span>';
			return reste ? badge + ' ' + reste : badge;
		}

		// Autres valeurs textuelles (ex: "coupe CRK")
		return val;
	}

	// Formater le résultat d'une compétition avec badge
	function formatCompetitionResult(val) {
		if (!val) return '';

		// Valeur numérique
		var match = val.match(/^(\d+)/);
		if (match) {
			var num = match[1];
			var reste = val.substring(num.length).trim();
			var badgeClass = 'result-badge';
			var numInt = parseInt(num, 10);
			// Toujours colorer les positions 1, 2, 3
			if (numInt <= 3) {
				badgeClass += ' result-' + num;
			}
			var badge = '<span class="' + badgeClass + '">P' + num + '</span>';
			return reste ? badge + ' ' + reste : badge;
		}

		return val;
	}

	function isVictoire(result) {
		var r = (result || '').toLowerCase();
		return r === '1' || r === '1er' || r.indexOf('vainqueur') !== -1;
	}

	// Détecter si une position est un podium (1, 2 ou 3)
	function isPodium(val) {
		if (!val) return false;
		var valLower = val.toLowerCase();
		if (valLower === '1er' || valLower === 'vainqueur') return true;
		var match = val.match(/^(\d+)/);
		if (match) {
			var num = parseInt(match[1], 10);
			return num >= 1 && num <= 3;
		}
		return false;
	}

	// Détecter automatiquement les colonnes à afficher pour une liste de courses
	function detectColumns(courses) {
		// Collecter toutes les colonnes présentes dans les données
		var foundColumns = new Set();
		courses.forEach(function(course) {
			Object.keys(course).forEach(function(key) {
				if (ignoredColumns.indexOf(key) === -1 && course[key]) {
					foundColumns.add(key);
				}
			});
		});

		// Construire la liste ordonnée
		var cols = ['date', 'circuit'];

		// Ajouter les colonnes dans l'ordre défini
		columnOrder.forEach(function(col) {
			if (col === 'date' || col === 'circuit') return;
			if (foundColumns.has(col)) {
				cols.push(col);
			}
		});

		// Ajouter les colonnes non listées dans columnOrder (nouvelles colonnes)
		foundColumns.forEach(function(col) {
			if (cols.indexOf(col) === -1) {
				// Insérer avant finale/resultat
				var insertIndex = cols.length;
				var finaleIndex = cols.indexOf('finale');
				var resultatIndex = cols.indexOf('resultat');
				if (finaleIndex !== -1) insertIndex = finaleIndex;
				else if (resultatIndex !== -1) insertIndex = resultatIndex;
				cols.splice(insertIndex, 0, col);
			}
		});

		return cols;
	}

	// Rendu des lignes de courses
	function renderCourseRows(coursesList, colsList) {
		var rowsHtml = '';
		coursesList.forEach(function(course) {
			rowsHtml += '<tr>';
			colsList.forEach(function(col) {
				var val = '';
				if (col === 'date') {
					val = formatDate(course.dateDebut, course.dateFin);
				} else {
					val = course[col] || '';
				}
				if (col === 'circuit') {
					// Ajouter le drapeau du pays
					if (course.pays) {
						val = getFlag(course.pays) + ' ' + val;
					}
					// Ajouter la manche
					if (course.manche) {
						val = val + ' ' + course.manche;
					}
				}
				// Colonnes de position : formater avec badge Pvaleur
				var isPositionCol = positionColumns.indexOf(col) !== -1;
				if (isPositionCol && val) {
					val = formatPosition(val);
				}
				// Ajouter badges statut sur la finale
				if (col === 'finale') {
					if (course.dnf) {
						val += ' <span class="status-badge status-dnf">DNF</span>';
					} else if (course.annulee) {
						val = '<span class="status-badge status-annulee">Annulée</span>';
					}
				}
				rowsHtml += '<td>' + val + '</td>';
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

			// Afficher toutes les compétitions
			if (season.competitions && season.competitions.length > 0) {
				season.competitions.forEach(function(comp) {
					var hasResultat = comp.resultat && comp.resultat.length > 0;
					var niveau = comp.niveau || 'regional';
					var niveauLabel = niveau === 'international' ? 'Mondiale' : (niveau === 'national' ? 'Nationale' : 'Régionale');

					html += '<div class="competition-block">';
					html += '<div class="classement-header niveau-' + niveau + '">';
					html += '<span class="niveau-badge niveau-badge-' + niveau + '">' + niveauLabel + '</span>';
					html += '<span class="classement-competition">' + comp.nom + '</span>';
					html += '<span class="classement-categorie">' + comp.categorie + '</span>';
					if (hasResultat) {
						html += '<span class="classement-result">' + formatCompetitionResult(comp.resultat) + '</span>';
					}
					html += '</div>';

					if (comp.courses && comp.courses.length > 0) {
						var cols = detectColumns(comp.courses);
						html += '<div class="table-container"><table><thead><tr>';
						cols.forEach(function(col) {
							html += '<th>' + getColumnLabel(col) + '</th>';
						});
						html += '</tr></thead><tbody>';
						html += renderCourseRows(comp.courses, cols);
						html += '</tbody></table></div>';
					}
					html += '</div>';
				});
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

		// Toutes les compétitions
		data.competitions.forEach(function(comp) {
			var year = comp.annee;
			if (!year && comp.courses && comp.courses.length > 0) {
				year = getYear(comp.courses[0].dateDebut);
			}
			if (year) {
				years.add(year);
				if (!byYear[year]) byYear[year] = { competitions: [] };
				byYear[year].competitions.push(comp);
			}
		});

		// Infos
		if (data.infos) {
			Object.keys(data.infos).forEach(function(y) {
				var year = parseInt(y, 10);
				years.add(year);
				if (!byYear[year]) byYear[year] = { competitions: [], info: data.infos[y] };
				else byYear[year].info = data.infos[y];
			});
		}

		// Trier les compétitions et leurs courses par date dans chaque année
		Object.keys(byYear).forEach(function(year) {
			// Trier les compétitions par date de première course
			byYear[year].competitions.sort(function(a, b) {
				var dateA = a.courses && a.courses.length > 0 ? a.courses[0].dateDebut : '';
				var dateB = b.courses && b.courses.length > 0 ? b.courses[0].dateDebut : '';
				return (dateA || '').localeCompare(dateB || '');
			});
			// Trier les courses dans chaque compétition
			byYear[year].competitions.forEach(function(comp) {
				if (comp.courses && comp.courses.length > 1) {
					comp.courses.sort(function(a, b) {
						return (a.dateDebut || '').localeCompare(b.dateDebut || '');
					});
				}
			});
		});

		return { byYear: byYear, years: Array.from(years).sort(function(a, b) { return b - a; }) };
	}

	function extractAndPopulateFilters(data, years) {
		var circuits = new Set();
		var competitions = new Set();
		var categories = new Set();

		data.competitions.forEach(function(comp) {
			competitions.add(comp.nom);
			categories.add(comp.categorie);
			if (comp.courses) {
				comp.courses.forEach(function(c) {
					if (c.circuit) circuits.add(c.circuit);
					if (c.categorie) categories.add(c.categorie);
				});
			}
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

	function matchesCourse(course, filters) {
		if (filters.circuit && course.circuit !== filters.circuit) return false;
		if (filters.categorie && course.categorie !== filters.categorie) return false;
		if (filters.podium && !isPodium(course.finale)) return false;
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
				competitions: []
			};

			// Filtrer les compétitions
			seasonData.competitions.forEach(function(comp) {
				var matchesComp = matchesCompetition(comp.nom, competitionVal);
				var matchesCat = !categorieVal || comp.categorie === categorieVal;
				var matchesPod = !podiumVal || isPodium(comp.resultat);

				if (matchesComp && matchesCat) {
					var filteredComp = {
						nom: comp.nom,
						categorie: comp.categorie,
						resultat: comp.resultat,
						niveau: comp.niveau,
						courses: []
					};

					if (comp.courses) {
						comp.courses.forEach(function(course) {
							if (matchesCourse(course, filters)) {
								filteredComp.courses.push(course);
								totalRaces++;
								if (isPodium(course.finale)) {
									totalPodiums++;
								} else if (isPodium(course.finaleB)) {
									totalPodiums++;
								}
							}
						});
					}
					// Compter le podium du résultat de championnat
					if (isPodium(comp.resultat)) {
						totalPodiums++;
					}

					if (filteredComp.courses.length > 0 || (matchesPod && !circuitVal)) {
						filteredSeason.competitions.push(filteredComp);
					}
				}
			});

			var hasActiveFilters = circuitVal || competitionVal || categorieVal || podiumVal;
			var hasContent = filteredSeason.competitions.length > 0;
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
			applyFilters();
		})
		.catch(function(err) {
			console.error('Erreur:', err);
			container.innerHTML = '<p>Erreur lors du chargement des résultats.</p>';
		});
})();
