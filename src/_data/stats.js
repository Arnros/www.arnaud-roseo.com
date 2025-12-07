const resultats = require('../data/resultats.json');

function isPodium(val) {
	if (!val) return false;
	const v = val.toLowerCase();
	if (v === '1er' || v === 'vainqueur') return true;
	const m = val.match(/^(\d+)/);
	if (m) return parseInt(m[1]) <= 3;
	return false;
}

function isVictoire(val) {
	if (!val) return false;
	const v = val.toLowerCase();
	return v === '1' || v === '1er' || v.includes('vainqueur');
}

function isTop10(val) {
	if (!val) return false;
	const m = val.match(/^(\d+)/);
	if (m) return parseInt(m[1]) <= 10;
	return false;
}

function getYear(dateStr) {
	if (!dateStr) return null;
	return parseInt(dateStr.substring(0, 4), 10);
}

module.exports = function() {
	let totalCourses = 0;
	let totalPodiums = 0;
	let totalVictoires = 0;
	let top10Nationaux = 0;
	const circuits = new Set();
	const yearsWithCourses = new Set();
	const titresRegionaux = new Set();

	resultats.competitions.forEach(comp => {
		// Compter les TOP 10 nationaux (Championnat de France)
		if (comp.nom.toLowerCase().includes('championnat de france') && isTop10(comp.resultat)) {
			top10Nationaux++;
		}

		// Compter les titres régionaux (P1 au championnat de l'ouest ou trophée de Bretagne)
		if (isVictoire(comp.resultat) && (comp.nom.includes('ouest') || comp.nom.includes('Bretagne'))) {
			const year = comp.annee || (comp.courses && comp.courses.length > 0 ? getYear(comp.courses[0].dateDebut) : null);
			if (year) titresRegionaux.add(year + '-' + comp.nom);
		}

		// Compter les podiums des résultats de championnat
		if (isPodium(comp.resultat)) {
			totalPodiums++;
			if (isVictoire(comp.resultat)) totalVictoires++;
		}

		if (comp.courses) {
			comp.courses.forEach(c => {
				totalCourses++;
				if (c.circuit) circuits.add(c.circuit);
				const year = getYear(c.dateDebut);
				if (year) yearsWithCourses.add(year);
				if (isPodium(c.finale)) {
					totalPodiums++;
					if (isVictoire(c.finale)) totalVictoires++;
				} else if (isPodium(c.finaleB)) {
					totalPodiums++;
					if (isVictoire(c.finaleB)) totalVictoires++;
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
		saisons: yearsWithCourses.size,
		courses: totalCourses,
		podiums: totalPodiums,
		victoires: totalVictoires,
		circuits: circuits.size,
		titresRegionaux: titresRegionaux.size,
		top10Nationaux
	};
};
