'use strict';
'require baseclass';
'require ui';

return baseclass.extend({
	__init__() {
		ui.menu.load().then(L.bind(this.render, this));
	},

	render(tree) {
		let node = tree;
		let url = '';

		this.renderModeMenu(node);

		if (L.env.dispatchpath.length >= 3) {
			for (var i = 0; i < 3 && node; i++) {
				node = node.children[L.env.dispatchpath[i]];
				url = url + (url ? '/' : '') + L.env.dispatchpath[i];
			}

			if (node)
				this.renderTabMenu(node, url);
		}

		document.querySelector('.showSide')
			?.addEventListener('click', ui.createHandlerFn(this, 'handleSidebarToggle'));

		document.querySelector('.darkMask')
			?.addEventListener('click', ui.createHandlerFn(this, 'handleSidebarToggle'));
			
		const loadingEl = document.querySelector(".main > .loading");
		if (loadingEl) {
			loadingEl.style.opacity = '0';
			loadingEl.style.visibility = 'hidden';
		}

		if (window.innerWidth <= 1152) {
			const mainLeft = document.querySelector('.main-left');
			if (mainLeft) mainLeft.style.width = '0';
		}

		window.addEventListener('resize', this.handleSidebarToggle, true);
		
		// Glassmorphism specific enhancements
		this.addGlassmorphismEffects();
	},

	// Add Glassmorphism theme specific visual effects
	addGlassmorphismEffects() {
		// Add glass effects to navigation elements
		const menuElements = document.querySelectorAll('.nav li, .slide-menu li');
		menuElements.forEach(el => {
			el.addEventListener('mouseenter', function() {
				this.style.background = 'rgba(255, 255, 255, 0.12)';
				this.style.backdropFilter = 'blur(15px)';
				this.style.transition = 'all 0.3s ease';
			});
			
			el.addEventListener('mouseleave', function() {
				this.style.background = '';
				this.style.backdropFilter = '';
			});
		});

		// Add special effects to active menu items
		const activeItems = document.querySelectorAll('.nav li.active, .slide-menu li.active');
		activeItems.forEach(el => {
			el.style.background = 'rgba(233, 69, 96, 0.15)';
			el.style.borderRadius = '8px';
			el.style.border = '1px solid rgba(233, 69, 96, 0.3)';
		});

		// Add glass effects to loading animation
		const loading = document.querySelector('.main > .loading');
		if (loading) {
			loading.style.background = 'rgba(26, 26, 46, 0.9)';
			loading.style.backdropFilter = 'blur(20px)';
		}
	},

	handleMenuExpand(ev) {
		const a = ev.target;
		const ul1 = a.parentNode;
		const ul2 = a.nextElementSibling;

		document.querySelectorAll('li.slide.active').forEach(function(li) {
			if (li !== a.parentNode || li == ul1) {
				li.classList.remove('active');
				li.childNodes[0].classList.remove('active');
			}

			if (li == ul1)
				return;
		});

		if (!ul2)
			return;

		if (ul2.parentNode.offsetLeft + ul2.offsetWidth <= ul1.offsetLeft + ul1.offsetWidth)
			ul2.classList.add('align-left');

		ul1.classList.add('active');
		a.classList.add('active');
		a.blur();

		// Glassmorphism animation effects
		ul2.style.background = 'rgba(255, 255, 255, 0.08)';
		ul2.style.backdropFilter = 'blur(15px)';
		ul2.style.border = '1px solid rgba(255, 255, 255, 0.15)';
		ul2.style.borderRadius = '12px';
		ul2.style.boxShadow = '0 8px 32px rgba(31, 38, 135, 0.37)';
		ul2.style.animation = 'glassSlideIn 0.3s ease-out';

		ev.preventDefault();
		ev.stopPropagation();
	},

	renderMainMenu(tree, url, level) {
		const l = (level || 0) + 1;
		const ul = E('ul', { 'class': level ? 'slide-menu' : 'nav' });
		const children = ui.menu.getChildren(tree);

		if (children.length == 0 || l > 2)
			return E([]);

		children.forEach(child => {
			const submenu = this.renderMainMenu(child, url + '/' + child.name, l);
			const isActive = (L.env.dispatchpath[l] == child.name);
			const hasChildren = submenu.children.length;

			ul.appendChild(E('li', { 
				'class': (hasChildren ? 'slide' + (isActive ? ' active' : '') : (isActive ? ' active' : '')),
				'style': isActive ? 'background: rgba(233, 69, 96, 0.15); border-radius: 8px; border: 1px solid rgba(233, 69, 96, 0.3);' : ''
			}, [
				E('a', {
					'href': hasChildren ? '#' : L.url(url, child.name),
					'class': hasChildren ? 'menu' + (isActive ? ' active' : '') : '',
					'click': hasChildren ? ui.createHandlerFn(this, 'handleMenuExpand') : '',
					'data-title': hasChildren ? '' : _(child.title),
				}, [
					_(child.title)
				]),
				submenu
			]));
		});

		if (l == 1) {
			var container = document.querySelector('#topmenu');

			if (container) {
				container.appendChild(ul);
				container.style.display = '';
			}
		}

		return ul;
	},

	renderModeMenu(tree) {
		const ul = document.querySelector('#modemenu');
		const children = ui.menu.getChildren(tree);

		children.forEach((child, index) => {
			const isActive = L.env.requestpath.length
				? child.name === L.env.requestpath[0]
				: index === 0;

			const li = E('li', {}, [
				E('a', {
					'href': L.url(child.name),
					'class': isActive ? 'active' : '',
					'style': isActive ? `
						background: linear-gradient(45deg, rgba(233, 69, 96, 0.2), rgba(147, 51, 234, 0.2));
						border: 1px solid rgba(233, 69, 96, 0.3);
						border-radius: 8px;
						backdrop-filter: blur(10px);
						box-shadow: 0 4px 15px rgba(233, 69, 96, 0.2);
					` : ''
				}, [ _(child.title) ])
			]);

			// Add hover effects to mode menu
			li.addEventListener('mouseenter', function() {
				if (!isActive) {
					this.style.background = 'rgba(255, 255, 255, 0.08)';
					this.style.borderRadius = '8px';
					this.style.transition = 'all 0.3s ease';
				}
			});
			
			li.addEventListener('mouseleave', function() {
				if (!isActive) {
					this.style.background = '';
				}
			});

			ul.appendChild(li);

			if (isActive)
				this.renderMainMenu(child, child.name);

			if (index > 0 && index < children.length)
				ul.appendChild(E('li', {'class': 'divider'}, [E('span')]))
		});

		if (children.length > 1)
			ul.parentElement.style.display = '';
	},

	renderTabMenu(tree, url, level) {
		const container = document.querySelector('#tabmenu');
		const l = (level || 0) + 1;
		const ul = E('ul', { 'class': 'tabs' });
		const children = ui.menu.getChildren(tree);
		let activeNode = null;

		if (children.length == 0)
			return E([]);

		children.forEach(child => {
			const isActive = (L.env.dispatchpath[l + 2] == child.name);
			const activeClass = isActive ? ' active' : '';
			const className = 'tabmenu-item-%s %s'.format(child.name, activeClass);

			const tabLi = E('li', { 'class': className }, [
				E('a', { 
					'href': L.url(url, child.name),
					'style': isActive ? `
						background: rgba(233, 69, 96, 0.15);
						border: 1px solid rgba(233, 69, 96, 0.3);
						border-radius: 8px 8px 0 0;
						backdrop-filter: blur(10px);
					` : ''
				}, [
					_(child.title)
				])
			]);

			// Tab hover effects
			tabLi.addEventListener('mouseenter', function() {
				if (!isActive) {
					this.querySelector('a').style.background = 'rgba(255, 255, 255, 0.08)';
					this.querySelector('a').style.borderRadius = '8px 8px 0 0';
					this.querySelector('a').style.transition = 'all 0.3s ease';
				}
			});

			tabLi.addEventListener('mouseleave', function() {
				if (!isActive) {
					this.querySelector('a').style.background = '';
				}
			});

			ul.appendChild(tabLi);

			if (isActive)
				activeNode = child;
		})

		container.appendChild(ul);
		container.style.display = '';

		if (activeNode)
			container.appendChild(this.renderTabMenu(activeNode, url + '/' + activeNode.name, l));

		return ul;
	},

	renderMainMenu(tree, url, level) {
		const ul = level ? E('ul', { 'class': 'dropdown-menu' }) : document.querySelector('#topmenu');
		const children = ui.menu.getChildren(tree);

		if (children.length == 0 || level > 1)
			return E([]);

		children.forEach(child => {
			const submenu = this.renderMainMenu(child, url + '/' + child.name, (level || 0) + 1);
			const subclass = (!level && submenu.firstElementChild) ? 'dropdown' : '';
			const linkclass = (!level && submenu.firstElementChild) ? 'menu' : '';
			const linkurl = submenu.firstElementChild ? '#' : L.url(url, child.name);

			const li = E('li', { 'class': subclass }, [
				E('a', { 'class': linkclass, 'href': linkurl }, [
					_(child.title),
				]),
				submenu
			]);

			ul.appendChild(li);
		});

		if (ul && ul.style) {
			ul.style.display = '';
		}

		return ul;
	},

	handleSidebarToggle(ev) {
		const width = window.innerWidth;
		const darkMask = document.querySelector('.darkMask');
		const mainRight = document.querySelector('.main-right');
		const mainLeft = document.querySelector('.main-left');
		
		// Safety check, return directly if element does not exist
		if (!mainLeft) return;
		
		let open = mainLeft.style.width == '';

		if (width > 1152 || ev.type == 'resize')
			open = true;
		
		// Glassmorphism dark mask effects - only operate when element exists
		if (darkMask) {
			darkMask.style.visibility = open ? '' : 'visible';
			darkMask.style.opacity = open ? '': 1;
			darkMask.style.background = 'rgba(26, 26, 46, 0.8)';
			darkMask.style.backdropFilter = 'blur(5px)';
		}

		if (width <= 1152) {
			mainLeft.style.width = open ? '0' : '';
			// Sidebar slide-out animation
			mainLeft.style.transition = 'width 0.3s ease';
		} else {
			mainLeft.style.width = ''
		}

		mainLeft.style.visibility = open ? '' : 'visible';
		if (mainRight) {
			mainRight.style['overflow-y'] = open ? 'visible' : 'hidden';
		}

		// Add sidebar glass effects
		if (!open) {
			mainLeft.style.background = 'rgba(26, 26, 46, 0.95)';
			mainLeft.style.backdropFilter = 'blur(20px)';
			mainLeft.style.borderRight = '1px solid rgba(255, 255, 255, 0.1)';
		}
	}
});