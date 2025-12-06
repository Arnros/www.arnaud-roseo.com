(function() {
	'use strict';

	// ==========================================================================
	// Page Loader
	// ==========================================================================
	var pageLoader = document.getElementById('pageLoader');
	if (pageLoader) {
		window.addEventListener('load', function() {
			setTimeout(function() {
				pageLoader.classList.add('hidden');
			}, 300);
		});
	}

	// ==========================================================================
	// Theme Toggle (Dark/Light Mode)
	// ==========================================================================
	var themeToggle = document.getElementById('themeToggle');
	var savedTheme = localStorage.getItem('theme');

	if (savedTheme) {
		document.documentElement.setAttribute('data-theme', savedTheme);
	}

	if (themeToggle) {
		themeToggle.addEventListener('click', function() {
			var currentTheme = document.documentElement.getAttribute('data-theme');
			var newTheme = currentTheme === 'light' ? 'dark' : 'light';
			document.documentElement.setAttribute('data-theme', newTheme);
			localStorage.setItem('theme', newTheme);
		});
	}

	// ==========================================================================
	// Back to Top Button
	// ==========================================================================
	var backToTop = document.createElement('button');
	backToTop.className = 'back-to-top';
	backToTop.setAttribute('aria-label', 'Retour en haut');
	document.body.appendChild(backToTop);

	window.addEventListener('scroll', function() {
		if (window.pageYOffset > 500) {
			backToTop.classList.add('visible');
		} else {
			backToTop.classList.remove('visible');
		}
	});

	backToTop.addEventListener('click', function() {
		window.scrollTo({
			top: 0,
			behavior: 'smooth'
		});
	});

	// ==========================================================================
	// Stats Counter Animation
	// ==========================================================================
	var statNumbers = document.querySelectorAll('.stat-number');

	if (statNumbers.length > 0 && 'IntersectionObserver' in window) {
		var statsObserver = new IntersectionObserver(function(entries, observer) {
			entries.forEach(function(entry) {
				if (entry.isIntersecting) {
					var el = entry.target;
					var target = parseInt(el.getAttribute('data-target'), 10);
					var duration = 2000;
					var start = 0;
					var startTime = null;

					function animate(currentTime) {
						if (!startTime) startTime = currentTime;
						var progress = Math.min((currentTime - startTime) / duration, 1);
						var easeProgress = 1 - Math.pow(1 - progress, 3);
						el.textContent = Math.floor(easeProgress * target);
						if (progress < 1) {
							requestAnimationFrame(animate);
						} else {
							el.textContent = target;
						}
					}
					requestAnimationFrame(animate);
					observer.unobserve(el);
				}
			});
		}, { threshold: 0.5 });

		statNumbers.forEach(function(el) {
			el.textContent = '0';
			statsObserver.observe(el);
		});
	}

	// ==========================================================================
	// Mobile Menu
	// ==========================================================================
	var navToggle = document.getElementById('navToggle');
	var mobileMenu = document.getElementById('mobileMenu');

	if (navToggle && mobileMenu) {
		navToggle.addEventListener('click', function() {
			var isOpen = mobileMenu.classList.toggle('active');
			navToggle.classList.toggle('active');
			navToggle.setAttribute('aria-expanded', isOpen);
			navToggle.setAttribute('aria-label', isOpen ? 'Fermer le menu' : 'Ouvrir le menu');
			mobileMenu.setAttribute('aria-hidden', !isOpen);
		});

		mobileMenu.querySelectorAll('.mobile-menu-link').forEach(function(link) {
			link.addEventListener('click', function() {
				mobileMenu.classList.remove('active');
				navToggle.classList.remove('active');
				navToggle.setAttribute('aria-expanded', 'false');
				navToggle.setAttribute('aria-label', 'Ouvrir le menu');
				mobileMenu.setAttribute('aria-hidden', 'true');
			});
		});
	}

	// ==========================================================================
	// Accordion
	// ==========================================================================
	document.querySelectorAll('.season-btn').forEach(function(btn) {
		btn.addEventListener('click', function() {
			var content = this.nextElementSibling;
			var isActive = this.classList.contains('active');

			document.querySelectorAll('.season-btn').forEach(function(b) {
				b.classList.remove('active');
				if (b.nextElementSibling) {
					b.nextElementSibling.classList.remove('active');
				}
			});

			if (!isActive) {
				this.classList.add('active');
				if (content) content.classList.add('active');
			}
		});
	});

	// ==========================================================================
	// Fade In Animation
	// ==========================================================================
	var fadeElements = document.querySelectorAll('.fade-in');

	if (fadeElements.length > 0 && 'IntersectionObserver' in window) {
		var fadeObserver = new IntersectionObserver(function(entries, observer) {
			entries.forEach(function(entry) {
				if (entry.isIntersecting) {
					entry.target.classList.add('visible');
					observer.unobserve(entry.target);
				}
			});
		}, {
			threshold: 0.1,
			rootMargin: '0px 0px -50px 0px'
		});

		fadeElements.forEach(function(el) {
			fadeObserver.observe(el);
		});
	} else {
		fadeElements.forEach(function(el) {
			el.classList.add('visible');
		});
	}

	// ==========================================================================
	// Smooth Scroll
	// ==========================================================================
	document.querySelectorAll('a[href^="#"]').forEach(function(link) {
		link.addEventListener('click', function(e) {
			var href = this.getAttribute('href');
			if (href !== '#') {
				var target = document.querySelector(href);
				if (target) {
					e.preventDefault();
					var navHeight = document.querySelector('.nav').offsetHeight;
					window.scrollTo({
						top: target.getBoundingClientRect().top + window.pageYOffset - navHeight,
						behavior: 'smooth'
					});
				}
			}
		});
	});

	// ==========================================================================
	// Navbar Scroll Effect
	// ==========================================================================
	var nav = document.getElementById('nav');
	if (nav) {
		window.addEventListener('scroll', function() {
			var isLight = document.documentElement.getAttribute('data-theme') === 'light';
			if (window.pageYOffset > 100) {
				nav.style.background = isLight ? 'rgba(232, 232, 232, 0.98)' : 'rgba(10, 10, 10, 0.98)';
			} else {
				nav.style.background = isLight ? 'rgba(232, 232, 232, 0.95)' : 'rgba(10, 10, 10, 0.95)';
			}
		});
	}

	// ==========================================================================
	// Lightbox
	// ==========================================================================
	var galleryItems = document.querySelectorAll('.gallery-item');

	if (galleryItems.length > 0) {
		var images = [];
		var currentIndex = 0;

		galleryItems.forEach(function(item) {
			images.push({
				src: item.getAttribute('href'),
				alt: item.querySelector('img') ? item.querySelector('img').getAttribute('alt') : ''
			});
		});

		var lightbox = document.createElement('div');
		lightbox.className = 'lightbox';
		lightbox.innerHTML = '<div class="lightbox-content">' +
			'<span class="lightbox-counter"></span>' +
			'<button class="lightbox-close" aria-label="Fermer">&times;</button>' +
			'<button class="lightbox-nav lightbox-prev" aria-label="Précédent">&#10094;</button>' +
			'<img class="lightbox-image" src="" alt="">' +
			'<button class="lightbox-nav lightbox-next" aria-label="Suivant">&#10095;</button>' +
			'<div class="lightbox-caption"></div>' +
			'</div>';
		document.body.appendChild(lightbox);

		var lbImage = lightbox.querySelector('.lightbox-image');
		var lbCaption = lightbox.querySelector('.lightbox-caption');
		var lbCounter = lightbox.querySelector('.lightbox-counter');
		var lbClose = lightbox.querySelector('.lightbox-close');
		var lbPrev = lightbox.querySelector('.lightbox-prev');
		var lbNext = lightbox.querySelector('.lightbox-next');

		function openLightbox(index) {
			currentIndex = index;
			updateLightbox();
			lightbox.classList.add('active');
			document.body.style.overflow = 'hidden';
		}

		function closeLightbox() {
			lightbox.classList.remove('active');
			document.body.style.overflow = '';
		}

		function updateLightbox() {
			var img = images[currentIndex];
			lbImage.src = img.src;
			lbImage.alt = img.alt;
			lbCaption.textContent = img.alt;
			lbCounter.textContent = (currentIndex + 1) + ' / ' + images.length;
		}

		function nextImage() {
			currentIndex = (currentIndex + 1) % images.length;
			updateLightbox();
		}

		function prevImage() {
			currentIndex = (currentIndex - 1 + images.length) % images.length;
			updateLightbox();
		}

		galleryItems.forEach(function(item, index) {
			item.addEventListener('click', function(e) {
				e.preventDefault();
				openLightbox(index);
			});
		});

		lbClose.addEventListener('click', closeLightbox);
		lbNext.addEventListener('click', nextImage);
		lbPrev.addEventListener('click', prevImage);

		lightbox.addEventListener('click', function(e) {
			if (e.target === lightbox) closeLightbox();
		});

		document.addEventListener('keydown', function(e) {
			if (lightbox.classList.contains('active')) {
				if (e.key === 'Escape') closeLightbox();
				else if (e.key === 'ArrowRight') nextImage();
				else if (e.key === 'ArrowLeft') prevImage();
			}
		});

		// Touch support
		var touchStartX = 0;
		var touchEndX = 0;

		lightbox.addEventListener('touchstart', function(e) {
			touchStartX = e.changedTouches[0].screenX;
		}, { passive: true });

		lightbox.addEventListener('touchend', function(e) {
			touchEndX = e.changedTouches[0].screenX;
			var diff = touchStartX - touchEndX;
			if (Math.abs(diff) > 50) {
				if (diff > 0) nextImage();
				else prevImage();
			}
		}, { passive: true });
	}

})();
