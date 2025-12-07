const resultats = require('../data/resultats.json');

function isPodium(val) {
	if (!val) return false;
	const m = val.match(/^(\d+)/);
	if (m) return parseInt(m[1]) <= 3;
	return false;
}

function isTop10(val) {
	if (!val) return false;
	const m = val.match(/^(\d+)/);
	if (m) return parseInt(m[1]) <= 10;
	return false;
}

module.exports = function() {
	let totalPodiums = 0;
	let top10Nationaux = 0;
	let top3Regionaux = 0;
	let participationsMondiaux = 0;
	const circuits = new Set();

	resultats.competitions.forEach(comp => {
		const niveau = comp.niveau;

		// Compter les participations aux mondiaux
		if (niveau === 'international') {
			participationsMondiaux++;
		}

		// Compter les TOP 10 nationaux (résultat championnat ou finale)
		if (niveau === 'national') {
			if (isTop10(comp.resultat)) {
				top10Nationaux++;
			} else if (comp.courses) {
				comp.courses.forEach(c => {
					if (isTop10(c.finale)) {
						top10Nationaux++;
					}
				});
			}
		}

		// Compter les TOP 3 régionaux
		if (niveau === 'regional' && isPodium(comp.resultat)) {
			top3Regionaux++;
		}

		// Compter les podiums des résultats de championnat
		if (isPodium(comp.resultat)) {
			totalPodiums++;
		}

		if (comp.courses) {
			comp.courses.forEach(c => {
				if (c.circuit) circuits.add(c.circuit);
				if (isPodium(c.finale)) {
					totalPodiums++;
				} else if (isPodium(c.finaleB)) {
					totalPodiums++;
				}
			});
		}
	});

	// Calculer les années d'expérience
	const anneeDebut = 2000;
	const anneeActuelle = new Date().getFullYear();
	const anneesExperience = anneeActuelle - anneeDebut;

	return {
		anneesExperience,
		podiums: totalPodiums,
		circuits: circuits.size,
		top3Regionaux,
		top10Nationaux,
		participationsMondiaux
	};
};
