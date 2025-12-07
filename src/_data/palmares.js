const resultats = require('../data/resultats.json');

function getPosition(val) {
	if (!val) return null;
	const m = val.match(/^(\d+)/);
	if (m) return parseInt(m[1]);
	return null;
}


function getCircuit(comp) {
	if (comp.courses && comp.courses.length > 0 && comp.courses[0].circuit) {
		return comp.courses[0].circuit;
	}
	return null;
}

function formatCircuit(circuit) {
	if (!circuit) return '';
	if (circuit === 'Le Mans') return 'au Mans';
	return 'à ' + circuit;
}

function getMedal(pos) {
	if (pos === 1) return '🥇';
	if (pos === 2) return '🥈';
	if (pos === 3) return '🥉';
	return '';
}

module.exports = function() {
	const events = [];

	resultats.competitions.forEach(comp => {
		const year = comp.annee;
		const pos = getPosition(comp.resultat);
		const niveau = comp.niveau;
		const circuit = getCircuit(comp);

		// Participations aux mondiaux
		if (niveau === 'international') {
			const medal = getMedal(pos);
			events.push({
				year,
				type: 'mondial',
				priority: 1,
				icon: '🌍',
				title: comp.nom + ' ' + comp.categorie,
				desc: pos ? (medal ? medal + ' ' : '') + pos + 'ème ' + formatCircuit(circuit) : 'Participation ' + formatCircuit(circuit)
			});
		}
		// TOP 5 nationaux (résultat championnat)
		else if (niveau === 'national' && pos && pos <= 5) {
			const medal = getMedal(pos);
			events.push({
				year,
				type: 'national',
				priority: 2,
				icon: medal || '🏆',
				title: pos + 'ème au ' + comp.nom + ' ' + comp.categorie,
				desc: formatCircuit(circuit)
			});
		}
		// TOP 10 nationaux en finale
		else if (niveau === 'national' && comp.courses) {
			comp.courses.forEach(course => {
				const finalePos = getPosition(course.finale);
				if (finalePos && finalePos <= 10) {
					const medal = getMedal(finalePos);
					const courseCircuit = course.circuit;
					events.push({
						year,
						type: 'national',
						priority: 2,
						icon: medal || '🏆',
						title: finalePos + 'ème en finale ' + comp.nom + ' ' + comp.categorie,
						desc: formatCircuit(courseCircuit)
					});
				}
			});
		}
		// Podiums régionaux
		if (niveau === 'regional' && pos && pos <= 3) {
			const medal = getMedal(pos);
			let title = '';
			if (pos === 1) {
				title = 'Champion ' + comp.nom.replace("Championnat de l'", '').replace('Trophée de ', '');
			} else if (pos === 2) {
				title = 'Vice-champion ' + comp.nom.replace("Championnat de l'", '').replace('Trophée de ', '');
			} else {
				title = '3ème ' + comp.nom;
			}
			title += ' ' + comp.categorie;

			events.push({
				year,
				type: 'regional',
				priority: 3,
				icon: medal,
				title,
				desc: ''
			});
		}
	});

	// Ajouter l'événement "Débuts en karting" pour 2000
	events.push({
		year: 2000,
		type: 'debut',
		priority: 10,
		icon: '🏁',
		title: 'Débuts en karting',
		desc: 'Première saison en catégorie Cadet'
	});

	// Trier par année décroissante, puis par priorité
	events.sort((a, b) => {
		if (b.year !== a.year) return b.year - a.year;
		return a.priority - b.priority;
	});

	// Regrouper les événements par année
	const byYear = {};
	events.forEach(e => {
		if (!byYear[e.year]) byYear[e.year] = [];
		byYear[e.year].push(e);
	});

	// Créer la timeline finale - chaque événement est une entrée séparée
	const timeline = [];
	const years = Object.keys(byYear).sort((a, b) => b - a);

	years.forEach(year => {
		const yearEvents = byYear[year];
		yearEvents.forEach((event, index) => {
			timeline.push({
				year: parseInt(year),
				showYear: index === 0, // Afficher l'année seulement pour le premier événement
				icon: event.icon,
				title: event.title,
				desc: event.desc,
				type: event.type
			});
		});
	});

	return timeline;
};
