(function() {

	var paths = {
		'default': 'home',
		'location': 'view',
		'share': 'share'
	};

	var els = {
		content: document.querySelector('#content')
	};

	var routes = {
		home: function() {
			var source = document.querySelector('#start-template').innerHTML,
				template = Handlebars.compile(source);
			els.content.innerHTML = template();
		},

		share: function() {

			var source = document.querySelector('#share-template').innerHTML,
				template = Handlebars.compile(source),
				map;
			els.content.innerHTML = template();

			function initialize() {
				var mapOptions = {
					zoom: 15
				};
				map = new google.maps.Map(document.querySelector('#map'),
					mapOptions);

				// Try HTML5 geolocation
				if (navigator.geolocation) {
					navigator.geolocation.getCurrentPosition(function(position) {
						var pos = new google.maps.LatLng(position.coords.latitude,
							position.coords.longitude);

						processLinks(position.coords);

						var marker = new google.maps.Marker({
							position: pos,
							map: map,
							title: 'Found you!'
						});

						map.setCenter(pos);
					}, function() {
						handleNoGeolocation(true);
					});
				} else {
					// Browser doesn't support Geolocation
					handleNoGeolocation(false);
				}
			}

			function handleNoGeolocation(errorFlag) {
				var content = (errorFlag) ? 'Maybe next time, yeah?' : 'Error: Your browser doesn\'t support geolocation.',
					options = {
						map: map,
						position: new google.maps.LatLng(60, 105),
						content: content
					},
					infowindow = new google.maps.InfoWindow(options);

				map.setCenter(options.position);
			}

			setTimeout(initialize, 750);
		},

		view: function() {

			var source = document.querySelector('#view-template').innerHTML,
				template = Handlebars.compile(source),
				map;
			els.content.innerHTML = template();

			document.querySelector('#addMapUser').addEventListener('click', function(e) {
				e.preventDefault();
				calcRoute();
			});

			var path = window.location.hash.slice(1),
				data = JSON.parse(path.split('=')[1]);
			window.directionsService = new google.maps.DirectionsService();

			function initialize() {
				window.directionsDisplay = new google.maps.DirectionsRenderer();
				var them = new google.maps.LatLng(data.latitude, data.longitude);
				var mapOptions = {
					zoom: 15,
					center: them
				};
				map = new google.maps.Map(document.getElementById('map'), mapOptions);
				var marker = new google.maps.Marker({
					position: them,
					map: map,
					title: 'Your friend!'
				});
				window.directionsDisplay.setMap(map);
			}

			function calcRoute() {
				if (navigator.geolocation) {
					navigator.geolocation.getCurrentPosition(function(position) {
						var pos = new google.maps.LatLng(position.coords.latitude,
							position.coords.longitude);

						var start = data.latitude + "," + data.longitude;
						var end = pos;
						var request = {
							origin: start,
							destination: end,
							travelMode: google.maps.TravelMode.WALKING
						};
						window.directionsService.route(request, function(response, status) {
							if (status == google.maps.DirectionsStatus.OK) {
								window.directionsDisplay.setDirections(response);
							}
						});
					});
				}
			}
			initialize();
		}
	};

	var processLinks = function(data) {
		var linkVal = 'http://' + window.location.host + '/%23location,data=' + JSON.stringify({
			longitude: data.longitude,
			latitude: data.latitude
		});

		var url = "http://api.bit.ly/v3/shorten?login=benhowdle89&apiKey=R_01f556645116f8620103c31e48d7f2a2&longUrl=" + linkVal + "&format=json",
			xhr = new XMLHttpRequest();

		xhr.open('GET', url);
		xhr.addEventListener('readystatechange', function() {
			if (xhr.readyState == 4 && xhr.status == 200) {
				var json = JSON.parse(xhr.responseText),
					bitlyLink = json.data.url,
					tweet = document.querySelector('#tweet-loc'),
					email = document.querySelector('#email-loc');

				var linkInput = document.querySelector('#link');
				linkInput.value = bitlyLink;
				tweet.setAttribute('href', tweet.getAttribute('href').replace("||RESULT||", bitlyLink));
				email.setAttribute('href', email.getAttribute('href').replace("||RESULT||", bitlyLink));
				document.querySelector('.sharing-links').removeAttribute('hidden');
			}
		});
		xhr.send();
	};

	var router = (function() {
		return {
			init: function() {
				var path = window.location.hash.slice(1);
				if (path === '' || path === '#') {
					routes[paths['default']]();
				} else if (path.match(/location/i)) {
					routes[paths.location]();
				} else {
					routes[paths[path]]();
				}
			}
		};
	})();

	router.init();

	window.addEventListener('hashchange', router.init);

})();