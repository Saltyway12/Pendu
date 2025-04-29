"use strict";

// Sélection des éléments du DOM
const motEl = document.querySelector(".mot");
const mauvaiseLettresEl = document.querySelector(".lettresFausses");
const rejouerBtn = document.querySelector(".play-button");
const resetBtn = document.querySelector(".reset-button");
const shareBtn = document.querySelector(".share-button");
const popup = document.querySelector(".conteneur-popUp");
const notif = document.querySelector(".notif");
const messageFinal = document.querySelector(".messageFinal");
const penduParts = document.querySelectorAll(".pendu-parts");
const difficultySelect = document.querySelector(".difficulty");
const displayTheme = document.querySelector(".displayTheme");
const notifMessage = document.querySelector(".notif p");
const clavierContainer = document.getElementById("clavier-container");
const victoryCount = document.querySelector(".victories");
const defeatCount = document.querySelector(".defeats");

// Variables du jeu
let motChoisi = "";
let theme = {};
const MAX_ERREURS = 6;
const bonnesLettresArr = [];
const mauvaiseLettresArr = [];
let jeuEnCours = true;
let victories = 0;
let defeats = 0;

// Initialisation du jeu
initialiserJeu();

/**
 * Initialise ou réinitialise le jeu
 */
function initialiserJeu() {
	// Vider les tableaux de lettres
	bonnesLettresArr.length = 0;
	mauvaiseLettresArr.length = 0;

	// Réinitialiser l'affichage
	updateMauvaiseLettresEl();
	popup.style.display = "none";

	// Choisir un nouveau mot
	choisirMot();

	// Réinitialiser le clavier virtuel
	resetClavierVirtuel();

	// Remettre le jeu en cours
	jeuEnCours = true;
}

/**
 * Réinitialise l'état du clavier virtuel
 */
function resetClavierVirtuel() {
	const touches = clavierContainer.querySelectorAll(".key-button");
	touches.forEach((touche) => {
		touche.classList.remove("used");
		touche.removeAttribute("disabled");
	});
}

/**
 * Choisit un mot aléatoire depuis le fichier thème JSON
 */
function choisirMot() {
	// Afficher un indicateur de chargement
	motEl.innerHTML = '<div class="loading">Chargement...</div>';

	fetch("theme.json")
		.then((response) => {
			if (!response.ok) {
				throw new Error(`Erreur HTTP: ${response.status}`);
			}
			return response.json();
		})
		.then((data) => {
			const themes = data;
			if (!themes || themes.length === 0) {
				throw new Error("Aucun thème trouvé !");
			}

			// Sélection aléatoire du thème
			const randomTheme = themes[Math.floor(Math.random() * themes.length)];

			// Sélection aléatoire d'une liste de cette thématique
			const randomLetters =
				randomTheme.Listes[
					Math.floor(Math.random() * randomTheme.Listes.length)
				];

			// Si la lettre est vide, on recommence
			if (randomLetters.Lettre === " ") {
				return choisirMot();
			}

			// Sélection aléatoire d'un mot de cette liste
			const words =
				randomLetters.Mots[
					Math.floor(Math.random() * randomLetters.Mots.length)
				];

			// Vérification de la validité du mot
			if (!words || words.length === 0) {
				throw new Error("Aucun mot dans le tirage");
			}

			// Vérifier que le mot contient uniquement des lettres (avec accents)
			if (/^[a-zA-ZÀ-ÿ]+$/.test(words)) {
				motChoisi = words.toLowerCase();
				theme = randomTheme;
				afficherMot();
				console.log(
					`Thème: ${randomTheme.Thème_}, Lettre: ${randomLetters.Lettre}, Mot: ${motChoisi}`
				);
			} else {
				console.error("Le mot n'est pas valide :", words);
				choisirMot();
			}
		})
		.catch((error) => {
			console.error("Erreur lors du chargement du JSON :", error);
			// Si échec de chargement du thème, utiliser la liste alternative (mots.json)
			utiliserMotsAlternatifs();
		});
}

/**
 * Utilise la liste alternative de mots en cas d'échec du chargement du thème
 */
function utiliserMotsAlternatifs() {
	fetch("mots.json")
		.then((response) => response.json())
		.then((mots) => {
			if (!mots || mots.length === 0) {
				throw new Error("Aucun mot alternatif trouvé");
			}

			// Sélection aléatoire d'un mot
			motChoisi = mots[Math.floor(Math.random() * mots.length)].toLowerCase();

			// Définir un thème générique
			theme = { Thème_: "Programmation" };

			// Afficher le mot
			afficherMot();
			console.log(`Utilisation d'un mot alternatif: ${motChoisi}`);
		})
		.catch((error) => {
			console.error("Erreur avec la liste alternative :", error);
			// En dernier recours, utiliser un mot par défaut
			motChoisi = "javascript";
			theme = { Thème_: "Programmation" };
			afficherMot();
		});
}

/**
 * Affiche le mot caché et le thème selon la difficulté
 */
function afficherMot() {
	// Afficher le mot avec les lettres trouvées
	motEl.innerHTML = motChoisi
		.split("")
		.map(
			(lettre) => `
            <span class="lettres">${
							bonnesLettresArr.includes(lettre) ? lettre : ""
						}</span>
        `
		)
		.join("");

	// Afficher ou masquer le thème selon la difficulté
	if (difficultySelect.value === "easy") {
		displayTheme.innerHTML = theme.Thème_ || "Inconnu";
	} else {
		displayTheme.innerHTML = "Indisponible en mode difficile";
	}

	// Vérifier si le joueur a gagné
	verifierVictoire();
}

/**
 * Vérifie si le joueur a trouvé toutes les lettres du mot
 */
function verifierVictoire() {
	// Récupérer le mot affiché sans les sauts de ligne
	const motInterne = motEl.innerText.replace(/\n/g, "").trim();

	// Si le mot affiché est complet, c'est gagné
	if (motInterne === motChoisi && jeuEnCours) {
		jeuEnCours = false;
		// Incrémenter le compteur de victoires
		victories++;
		victoryCount.textContent = victories;
		sauvegarderScores();

		// Afficher le message de victoire
		messageFinal.innerHTML = `
            <span class="victory-message">Bravo, c'est trouvé!</span>
            <br>Le mot était bien <a href="https://www.google.com/search?q=${motChoisi}" 
            target="_blank" rel="noopener noreferrer">${motChoisi}</a>
        `;

		// Afficher l'animation de confettis (optionnelle)
		// afficherConfettis();

		// Montrer la popup
		popup.style.display = "flex";
	}
}

/**
 * Met à jour l'affichage des mauvaises lettres et du pendu
 */
function updateMauvaiseLettresEl() {
	// Afficher les mauvaises lettres à l'écran
	mauvaiseLettresEl.innerHTML = mauvaiseLettresArr
		.map((lettre) => `<span>${lettre}</span>`)
		.join("");

	// Afficher les éléments du pendu selon le nombre d'erreurs
	penduParts.forEach((part, index) => {
		part.style.display = index < mauvaiseLettresArr.length ? "block" : "none";
	});

	// Mettre à jour le clavier virtuel
	updateClavierVirtuel();

	// Vérifier si le joueur a perdu
	if (mauvaiseLettresArr.length === MAX_ERREURS && jeuEnCours) {
		jeuEnCours = false;
		// Incrémenter le compteur de défaites
		defeats++;
		defeatCount.textContent = defeats;
		sauvegarderScores();

		// Afficher le message de défaite
		messageFinal.innerHTML = `
            <span class="defeat-message">Malheureusement, c'est perdu.</span>
            <br>Le mot était <a href="https://www.google.com/search?q=${motChoisi}" 
            target="_blank" rel="noopener noreferrer">${motChoisi}</a>
        `;
		popup.style.display = "flex";
	}
}

/**
 * Affiche une notification temporaire
 * @param {string} message - Message à afficher
 */
function afficherNotification(message) {
	if (message) {
		notifMessage.textContent = message;
	}
	notif.classList.add("afficher");
	setTimeout(() => {
		notif.classList.remove("afficher");
	}, 2000);
}

/**
 * Gère l'appui sur une touche du clavier
 * @param {string} lettre - La lettre appuyée
 */
function traiterLettre(lettre) {
	// Si le jeu est terminé ou ce n'est pas une lettre, on ne fait rien
	if (!jeuEnCours || !/^[a-zà-ÿ]$/.test(lettre)) {
		return;
	}

	// Traiter la lettre selon qu'elle est dans le mot ou non
	if (motChoisi.includes(lettre)) {
		// La lettre est dans le mot
		if (!bonnesLettresArr.includes(lettre)) {
			// Ajouter la lettre aux bonnes lettres
			bonnesLettresArr.push(lettre);

			// Mettre à jour l'affichage du mot
			afficherMot();

			// Animation de réussite (option)
			animerLettreTrouvee(lettre);
		} else {
			afficherNotification("Vous avez déjà essayé cette lettre !");
		}
	} else {
		// La lettre n'est pas dans le mot
		if (!mauvaiseLettresArr.includes(lettre)) {
			// Ajouter aux mauvaises lettres
			mauvaiseLettresArr.push(lettre);

			// Mettre à jour l'affichage
			updateMauvaiseLettresEl();

			// Vibrer si disponible (appareils mobiles)
			if (navigator.vibrate) {
				navigator.vibrate(100);
			}
		} else {
			afficherNotification("Vous avez déjà essayé cette lettre !");
		}
	}
}

/**
 * Anime les lettres trouvées
 * @param {string} lettre - La lettre trouvée
 */
function animerLettreTrouvee(lettre) {
	// Sélectionner toutes les cases avec cette lettre
	const casesLettres = motEl.querySelectorAll(".lettres");

	// Appliquer une animation aux cases correspondant à la lettre trouvée
	casesLettres.forEach((caseLettre) => {
		const index = parseInt(caseLettre.dataset.index);
		if (motChoisi[index] === lettre) {
			// Ajouter une classe pour l'animation
			caseLettre.classList.add("lettre-trouvee");

			// Retirer la classe après l'animation
			setTimeout(() => {
				caseLettre.classList.remove("lettre-trouvee");
			}, 1000);
		}
	});
}

// ===== GESTIONNAIRES D'ÉVÉNEMENTS =====

// Gestionnaire d'événement pour les touches du clavier
window.addEventListener("keydown", (e) => {
	const lettre = e.key.toLowerCase();
	traiterLettre(lettre);
});

// Bouton pour rejouer
rejouerBtn.addEventListener("click", initialiserJeu);

// Changement de difficulté
difficultySelect.addEventListener("change", initialiserJeu);

// Clavier virtuel et initialisation
document.addEventListener("DOMContentLoaded", () => {
	// Créer le clavier virtuel (toujours présent pour une meilleure accessibilité)
	creerClavierVirtuel();

	// Charger les scores depuis le stockage local s'ils existent
	chargerScores();

	// Initialiser le jeu
	initialiserJeu();

	// Ajout des événements supplémentaires
	setupEventListeners();
});

/**
 * Crée le clavier virtuel
 */
function creerClavierVirtuel() {
	const lettres = "abcdefghijklmnopqrstuvwxyz";

	// On vide d'abord le contenu existant
	clavierContainer.innerHTML = "";

	// Création des touches
	for (const lettre of lettres) {
		const bouton = document.createElement("button");
		bouton.textContent = lettre;
		bouton.className = "key-button";
		bouton.dataset.lettre = lettre;
		bouton.setAttribute("aria-label", `Lettre ${lettre}`);

		bouton.addEventListener("click", () => traiterLettre(lettre));

		clavierContainer.appendChild(bouton);
	}
}

/**
 * Met à jour l'affichage du clavier virtuel en fonction des lettres déjà essayées
 */
function updateClavierVirtuel() {
	const touches = clavierContainer.querySelectorAll(".key-button");

	touches.forEach((touche) => {
		const lettre = touche.dataset.lettre;

		// Si la lettre a déjà été essayée
		if (
			bonnesLettresArr.includes(lettre) ||
			mauvaiseLettresArr.includes(lettre)
		) {
			touche.classList.add("used");
			touche.setAttribute("disabled", true);
		} else {
			touche.classList.remove("used");
			touche.removeAttribute("disabled");
		}
	});
}

/**
 * Ajoute tous les événements supplémentaires
 */
function setupEventListeners() {
	// Bouton pour réinitialiser le jeu
	resetBtn.addEventListener("click", initialiserJeu);

	// Bouton pour partager le score
	shareBtn.addEventListener("click", partagerScore);

	// Fermer le popup avec Escape
	document.addEventListener("keydown", (e) => {
		if (e.key === "Escape" && popup.style.display === "flex") {
			initialiserJeu();
		}
	});
}

/**
 * Charge les scores depuis le stockage local
 */
function chargerScores() {
	if (localStorage.getItem("pendu_victories")) {
		victories = parseInt(localStorage.getItem("pendu_victories"));
		victoryCount.textContent = victories;
	}

	if (localStorage.getItem("pendu_defeats")) {
		defeats = parseInt(localStorage.getItem("pendu_defeats"));
		defeatCount.textContent = defeats;
	}
}

/**
 * Sauvegarde les scores dans le stockage local
 */
function sauvegarderScores() {
	localStorage.setItem("pendu_victories", victories);
	localStorage.setItem("pendu_defeats", defeats);
}

/**
 * Partage le score du jeu
 */
function partagerScore() {
	const texte = `J'ai joué au Pendu ! Score: ${victories} victoires, ${defeats} défaites. Mon dernier mot était "${motChoisi}".`;

	if (navigator.share) {
		navigator
			.share({
				title: "Mon score au Pendu",
				text: texte,
			})
			.catch((err) => {
				console.error("Erreur de partage:", err);
				// Fallback: copier dans le presse-papier
				copierAuPressePapier(texte);
			});
	} else {
		// Pas de support de l'API Web Share, on copie dans le presse-papier
		copierAuPressePapier(texte);
	}
}

/**
 * Copie le texte dans le presse-papier
 * @param {string} texte - Le texte à copier
 */
function copierAuPressePapier(texte) {
	// Créer un élément temporaire
	const el = document.createElement("textarea");
	el.value = texte;
	el.setAttribute("readonly", "");
	el.style.position = "absolute";
	el.style.left = "-9999px";
	document.body.appendChild(el);

	// Sélectionner et copier
	el.select();
	document.execCommand("copy");
	document.body.removeChild(el);

	// Notifier l'utilisateur
	afficherNotification("Score copié dans le presse-papier!");
}
