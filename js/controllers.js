/*
	Project: TuCocinaVirtual
	Developer: Team Oglit
	Description:
		Contiene cada uno de los controladores encargados
		de gestionar el flujo de datos al usuario
	Date: 14/08/2015
*/

// modulo principal para los controladores de la aplicación
app = angular.module('tuCosina.controllers', ['ui.router', 'ngAnimate', 'satellizer', 'LocalStorageModule', 'mgcrea.ngStrap', 'firebase', 'cfp.loadingBar'])

// para enviar el token con cada peticion http
app.config(['$httpProvider', 'satellizer.config', function($httpProvider, config){
	$httpProvider.interceptors.push(['$q', function($q){
		var tokenName = config.tokenPrefix ? config.tokenPrefix + '_' + config.tokenName : config.tokenName;
		return {
			request: function(httpConfig){
				var token = localStorage.getItem(tokenName);
				if(token && config.httpInterceptor){
					token = config.authHeader === 'Authorization' ? 'Bearer' + token: token;
					httpConfig.headers[config.authHeader] = token;
				}
				return httpConfig;
			},
			responseError: function(response){
				return $q.reject(response);
			}
		};
	}]);
}]);

// controllar para la vista home
app.controller('homeController', ['$scope', function($scope){
	$scope.autenticado = function(){
		console.log('Login');
		return true;
	}
}]); // fin controlador home

// controllar para la vista login
app.controller('loginController', ['$scope', '$auth', '$location', 'localStorageService', '$firebaseAuth', '$firebaseObject', 'firebaseUrl','cfpLoadingBar', function($scope, $auth, $location, localStorageService, $firebaseAuth, $firebaseObject, firebaseUrl, cfpLoadingBar){
	var vm = this;
	$scope.isLoggedIn = false;

	// cfpLoadingBar.start();

	// referencia firebase
	var ref = new Firebase(firebaseUrl);
	var authObj = $firebaseAuth(ref);

	//inicializar y obtener estado autenticado actual
	init();


	
	// definir funcion init()
	function init(){
		authObj.$onAuth(authDataCallback);
		if(!authObj.$getAuth()){
			$location.path('/login');
		}else{
			$scope.isLoggedIn = true;
			$scope.rol  = "Autoservicio";
		}
	}


	// authDataCallback es un callback llamado cada vez que el estado de auth cambia 
	// en login o logout este metodo authDataCallback es llamado
	function authDataCallback(authData){
		if(authData){
			// authData contiene toda la info de este estado que esta autenticado
			console.log('User '+authData.uid+' esta loggeado con '+authData.provider);
			vm.isLoggedIn = true;
			//authData.uid contiene el user id devuelto por el provider eg.facebook
			var user = $firebaseObject(ref.child('usuarios').child(authData.uid));
			// checkear en firebase si existe ya el usuario y sino lo creo
			user.$loaded().then(function(){
				console.log(user.$id);

				var res = new Firebase("https://tucocina.firebaseio.com/restaurantes/");
				res.orderByChild("id_user").equalTo(user.$id).on("child_added", function(snapshot) {
					var rest = snapshot.val();
					console.log(rest.rol);
					if (rest.rol === 'autoservicio') {
						console.log('Eres un restaurante de autoservicios');
					}else{
						console.log('Eres un restaurante con meseros');
						$location.path('/panel');
					}
				});
				// $location.path('/panel');
			});
		} else {
			console.log('User esta logged out');
			vm.isLoggedIn = false;
			$location.path('/login');
		}
	}



	// login in firebase
	this.login = function(){
		var ref = new Firebase("https://tucocina.firebaseio.com");
		ref.authWithPassword({
		  email    : vm.email,
		  password : vm.password
		}, function(error, authData) {
		  if (error) {
		    console.log("Login Failed!", error);
		  } else {
		    console.log("Authenticated successfully with payload:", authData);
		    localStorageService.set('idUser', authData.uid);
			$location.path('/panel');
		  }
		});
	}

	$scope.autenticated = function(){
		return true;
	}


}]); //fin controlador login

// controllar para la vista signup
app.controller('signupController', ['$scope', '$http', 'Restaurantes', 'localStorageService', '$timeout', '$location', function($scope, $http, Restaurantes, localStorageService, $timeout, $location){
	$scope.ver = false;

	var vm = this;

	// signup in firebase
	this.signup = function(){
		var ref = new Firebase("https://tucocina.firebaseio.com");
		ref.createUser({
		  email    : vm.email,
		  password : vm.password
		}, function(error, userData) {
		  if (error) {
		    console.log("Error creating user:", error);
		  } else {
		    console.log("Successfully created user account with uid:", userData.uid);
		    localStorageService.set('idUser', userData.uid);
		    var file = vm.logo;
		    var fd = new FormData();
		    fd.append('foto', file);

		    var restaurante = {
		    	id_user: userData.uid,
				nombreRestaurante: vm.nombreRestaurante,
				nit: vm.nit,
				tipoEstablecimiento: vm.tipoEstablecimiento,
				numMesaReserva: vm.numMesaReserva,
				rol: 'restaurante',
				logo: file.name
	    	};

	    	Restaurantes.$add(restaurante);

		    $scope.ver = true;
			$scope.respuesta = 'Datos guardados!';


			// lo mando para el panel
			$timeout(function(){
				$location.path('/panel');
			}, 2000);
		  }
		});
	}

// funcion para guardar el logo del restaurante
function upload (form) {
	$http.post('http://tucocinavirtual.com/test/uploads-logo.php',form, {
	    transformRequest: angular.identity, 
        headers: {'Content-Type': undefined}
        })
        .success(function(response){
			console.log('Respuesta: '+response);
        })
        .error(function(response){
    });
};


}]); // fin controlador signup

// controlador para el panel
app.controller('panelController', ['$scope', '$http', 'localStorageService', 'Menu_categorias', 'Platos', 'Ingredientes', 'Adicionales', '$firebaseObject', function($scope, $http, localStorageService, Menu_categorias, Platos, Ingredientes, Adicionales, $firebaseObject){
	$scope.ver_ingrediente = false;
	$scope.ver_res_plato = false;
	$scope.ver = false;
	// Socket.on('categoria', function(categoria) {
 //    	console.log(categoria);
 //    	// $scope.categoriaadd = categoria.nombreCategoria;
	// });

	// cargar todas las categorias
	$scope.categorias = Menu_categorias;

	// cargar todos los platos
	$scope.platos = Platos;

	// function para agregar un nuevo plato
	$scope.addPlato = function(){
		// preparo la imagen
		var file = $scope.imagen;
        var fd = new FormData();
        fd.append('imagen', file);

        // objeto plato
		$scope.platos.$add({
			nombrePlato: $scope.nombrePlato,
			descripcion: $scope.descripcion,
			valor: $scope.valor,
			estado: $scope.estado,
			idCategoria: $scope.categoria,
			imagen: file.name
		});

		upload(fd);

		$scope.ver_res_plato = true;
		$scope.respuesta_plato = 'El plato se guardó correctamente';

	}//fin addPlato

	// funcion para agregar un ingrediente a un plato por medio de su ID
	$scope.addIngrediente = function(){
		var id = localStorageService.get('idPlato');
		var ingrediente = {
			nombreIngrediente: $scope.nombreIngrediente,
			idPlato: id
		};
		Ingredientes.$add(ingrediente);
	}// fin addIngrediente

		// funcion para agregar un adicional a un plato por medio de su ID
	$scope.addAdicional = function(){
		var id = localStorageService.get('idPlato');
		console.log(id);
		var adicional = {
			nombreAdicional: $scope.nombreAdicional,
			valor: $scope.valorAdicional,
			idPlato: id
		};

		Adicionales.$add(adicional);
	}// fin addAdicional

	// funcion para guardar la imagen del plato
	function upload (form) {
		$http.post('http://tucocinavirtual.com/test/uploads.php',form, {
		    transformRequest: angular.identity, 
	        headers: {'Content-Type': undefined}
	        })
	        .success(function(response){
				console.log('Respuesta: '+response);
	        })
	        .error(function(response){
	    });
	};

	// function para agregar una categoria
	$scope.addCategoria = function(){
		console.log('Categoria');
		var file = $scope.imagen;
        var fd = new FormData();
        fd.append('imagen', file);

		$scope.categorias.$add({
			nombreCategoria: $scope.nombreCategoria,
			imagen: file.name
		});
		upload(fd);
		$scope.respuesta_categoria = 'Registro éxitoso!';
		$scope.ver = true;
	}

	// cargo los ingredientes de un plato
	$scope.ingredientesLoad = function(idPlato){
		$scope.ingredientes = null;
		localStorageService.set('idPlato', idPlato);

		var count = 0;
		var ing = [];

		var ingre = new Firebase("https://tucocina.firebaseio.com/ingredientes/");
		ingre.orderByChild("idPlato").equalTo(idPlato).on("child_added", function(snapshot) {
			count++;
			ing[count] = snapshot.val();
			$scope.ingredientes = ing.filter(Boolean);
			console.log($scope.ingredientes);
		});
	}

	// cargo los adiconales de un plato
	$scope.adicionalesLoad = function(idPlato){
		$scope.adicionales = null;
		localStorageService.set('idPlato', idPlato);
		
		var count = 0;
		var adi = [];

		var adicionales = new Firebase("https://tucocina.firebaseio.com/adicionales/");
		adicionales.orderByChild("idPlato").equalTo(idPlato).on("child_added", function(snapshot) {
			count++;
			adi[count] = snapshot.val();
			$scope.adicionales = adi.filter(Boolean);
		});
	}

}]); //fin controler panel





// controllador para mostrar los pedidos en la cocina
app.controller('pedidosController', ['$scope', 'Pedidos', '$timeout', '$firebaseArray', function($scope, Pedidos, $timeout, $firebaseArray){
	
	
		var pedidos = new Firebase("https://tucocina.firebaseio.com/pedidos");
		pedidos.on("child_added", function(snapshot, prevChildKey) {
			var newPedido = snapshot.val();

			var options = {
			    body: "Se ha realizado un pedio desde la mesa " + newPedido.mesa,
			    icon: "public/img/doh.png"
			};
		 
			var notif = new Notification("Nuevo Pedido", options);

			notif.onshow = function() { 
				var sonido = document.getElementById("sound"); 
				 sonido.play(); 

				$timeout(function () {
					notif.close();
				}, 5000);
			}
			
		});

		$scope.pedidos = Pedidos;

	
	// $scope.pedidos = Pedidos;
	console.log($scope.pedidos);

	// habilito las notificaciones en el navegador
	$scope.notification = function () {
		console.log('Hola mundo!');
    	 if (Notification) {
        	Notification.requestPermission( function(status) {
			    if (status == "granted"){
			       var options = {
				    body: "Se ha realizado un pedio desde la mesa 10",
				    icon: "public/img/doh.png"
					};
				 
					var notif = new Notification("Nuevo Pedido", options);
					
					$timeout(function () {
						notif.close();
					}, 5000);
					// setTimeout(notif.close, 3000);
				}
			});
    	}	
	} // fin notification

}]);






// controlador para gestionar las promociones y platos del día
app.controller('promoController', ['$scope', 'Promos', 'imgPromos', '$http', 'localStorageService', function($scope, Promos, imgPromos, $http, localStorageService){
	$scope.ver= false;

	$scope.promos = Promos;
	$scope.promosImg = imgPromos;

	$scope.addPromo = function(){
		var id_user = localStorageService.get('idUser');

		// preparo la imagen
		var file = $scope.imagen;
        var fd = new FormData();
        fd.append('imagen_promo', file);

		var promo = {
			id_user: id_user,
			nombrePlato: $scope.nombrePlato,
			precioPlato: $scope.precioPlato,
			imagen: file.name
		};

		Promos.$add(promo);
		upload(fd);

		$scope.ver= true;
		$scope.respuesta_promo = "Promo agregada con éxito!";
	};

	$scope.addImgPromo = function(){
		var id_user = localStorageService.get('idUser');
		// preparo la imagen
		var file = $scope.imagen_promo;
		var fd = new FormData();
		fd.append('imagen_promo', file);

		imgPromos.$add({
			id_user: id_user,
			imagen_promo: file.name
		});

		upload(fd);
		$scope.ver= true;
		$scope.respuesta_promo_img = "Promo agregada con éxito!";
	
	};


	// funcion para guardar las imagenes de las promociones
	function upload (form) {
		$http.post('http://tucocinavirtual.com/test/uploads-promo.php',form, {
		    transformRequest: angular.identity, 
	        headers: {'Content-Type': undefined}
	        })
	        .success(function(response){
				console.log('Respuesta: '+response);
	        })
	        .error(function(response){
	        	console.log('response');
	    });
	};

}]);







// ***********************************************************************************************
// directiva para enviar la imagen al server
// esto deberia estar en un archivo independiente, es solo que es mi primera directiva xD
app.directive('fileModel', ['$parse', function ($parse) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            var model = $parse(attrs.fileModel);
            var modelSetter = model.assign;
 
            element.bind('change', function(){
                scope.$apply(function(){
                    modelSetter(scope, element[0].files[0]);
                });
            });
        }
    };
}])