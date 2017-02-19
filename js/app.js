(function(){
    "use strict";

    angular.module('Bookmarks',['ngResource','angularValidator','firebase'])
    //TODO No aplica funcion
    .service('Category',function($http){

        this.getAll = function(success,failure){
            $http.get('http://bookmarks-angular.herokuapp.com/api/categories')
                .success(success)
                .error(failure);
        };
    })
    //TODO No aplica
    .factory('Bookmark',function($resource){
        return $resource('http://bookmarks-angular.herokuapp.com/api/bookmarks/:id');
    })

    .controller('MainController', ['$scope','Category','Bookmark','$filter','$firebaseArray', function($scope,Category,Bookmark,$filter,$firebaseArray) {
    		
    	$scope.flagSave = true;
    	$scope.nodePrimary = null;
    	var secunce = 1;
    	$scope.name = 'Carl';
        $scope.selected = '';
        var diff = [];
        var debug = 0;
        
        $scope.categories = ['Creditos','Recreacion','Educacion','Mercados','Transporte','varios','Saldo Inicial'];        
        //Conexion de firebase
        var refGastos = firebase.database().ref().child("gastos");
        $scope.gastos = $firebaseArray(refGastos);
                
        $scope.init = function () {       	
        	$scope.gastos.$loaded().then(function() {
        		if($scope.gastos != null && $scope.gastos.length > 0){
        			secunce = parseInt(_.last($scope.gastos).id)+1;
        			console.log(secunce);
        			$scope.updateDataChar();
        		}
            });          	
        };

        
    	$scope.updateDataChar = function(){
        	var newobject = [['Name', 'ReportTo', 'tooltip']];
        	var fecha = '';
        	var porc = 0;
        	angular.forEach($scope.gastos, function(item) {
        		item.saldo = item.end ? item.valor :  $scope.obtenerGastoHijos(item.id);
        		porc = (item.saldo / item.valor) * 100;
        		porc = item.end ? 100 : porc;   
        		item.fecha = new Date(item.fecha);
        		fecha = item.fecha.getDate() + "/" + (item.fecha.getMonth() +1) + "/" + item.fecha.getFullYear() + " " +item.fecha.getHours()+":"+item.fecha.getMinutes();
        		newobject.push([{v: item.id , f:  fecha + ' <br/><b>valor '+ $filter('currency')(item.valor,'$',0) +'</br><div style="color:red; font-style:italic">'+item.categoria+'</div><div class="progress"><div class="progress-bar" role="progressbar" aria-valuenow="60" aria-valuemin="0" aria-valuemax="100" style="width: '+ porc +'%;"><span class="sr-only">'+ porc +'% completado</span></div></div>'},item.parent, 'Gasto Actual :'+ $filter('currency')(item.saldo) + " de " + $filter('currency')(item.valor)]);                
        	});
        	$scope.nodePrimary = _.find($scope.gastos, function(obj){ return obj.parent == ''; });
        	$scope.chartData = newobject;
        };
                
        $scope.setCurrentCategory = function(category){
            $scope.currentCategory = category;
        };

        $scope.isCurrentCategory = function(category){
            return $scope.currentCategory === category;
        };

        $scope.showWindow = function(bookmark){
            $scope.bookmarkForm.$setPristine();
            $scope.bookmarkForm.$setUntouched();
            
            if($scope.selected != ''){
            	//edicion del bookmark
            	var obj = _.find($scope.gastos, function(obj){ return obj.id == $scope.selected; }); 
            	bookmark = bookmark || { category:obj.categoria, fecha: obj.fecha, title: obj.valor, end: obj.end, observacion : obj.observacion};            	
            }else{
            	var now = new Date();
                now = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes());
                bookmark = bookmark || { category:$scope.currentCategory, fecha: now };            	
            }            
            
            $scope.bookmark = bookmark;
            $('#bookmarkModal').modal('show');
        };        
        /**
         * Obtien los gastos hijos
         */        
        $scope.eliminarHijo = function(nodoParent){ //console.log("eliminarHijo.("+nodoParent+")" + debug++);        	
        	angular.forEach($scope.gastos, function(obj, i) {
                if(obj.parent === nodoParent) {
                	this.push(obj);
                    $scope.eliminarHijo(obj.id);
                }
            },diff);
        };        
        
        $scope.eliminarHijos = function(nodoParent){ //console.log("eliminarHijos.("+nodoParent+")" +debug++);  
        	diff = [];
        	$scope.eliminarHijo(nodoParent);
        	angular.forEach(diff, function(obj) {
        		$scope.gastos.$remove(obj).then(function() {
        	       	$scope.init();
        	    });        		
        	});
        };
        
        /**
         * Obtener gastos de totales
         */
        $scope.obtenerGastoHijos = function(nodoParent){ //console.log("obtenerGastoHijos.("+nodoParent+")" + debug++);
        	var sum = 0;        	
        	angular.forEach($scope.gastos, function(obj) { 
                if(obj.parent === nodoParent) {
        			if( obj.end && !$scope.tieneHijos(obj.id) ){
        				sum+= obj.valor;
        			}else{
        				sum+= $scope.obtenerGastoHijos(obj.id);
        			}
                }
            },sum);
        	return sum;
        };
        
        $scope.tieneHijos = function(nodoParent){  //console.log("tieneHijos.("+nodoParent+")" + debug++);
        	var result = _.filter($scope.gastos, function(obj){ return obj.parent == nodoParent; });
        	return result != null && _.size(result) > 0 ;
        };        
        
        $scope.myValidationFunction = function(nodoParent,valor){  //console.log("myValidationFunction.("+nodoParent+","+valor+")" + debug++);   
        	console.log($scope.flagSave);
        	var obj = _.find($scope.gastos, function(obj){ return obj.id == nodoParent; });
        	var sum = _.reduce( $scope.getChilds(nodoParent) , function(memo, num){ return memo + num.valor; }, 0);
        	
        	if($scope.flagSave && obj != null && (sum + valor) > obj.valor){
        		var error = "El valor ingresado supera el valor del nodo, valor ingresado " + valor + " valor nodo " + (sum + valor);
        		console.log(error);
        		return error;
        	}else if ($scope.flagSave && obj != null && obj.end ){
        		var error = "Gasto cerrado";
        		console.log(error);
        		return error;
        	}
        	
        	if(!$scope.flagSave){
        		var sumaHermanos = _.reduce( $scope.getChilds(obj.parent) , function(memo, num){ return memo + num.valor; }, 0);
        		console.log($scope.getChilds(obj.parent));
        		var objPadre = _.find($scope.gastos, function(objPadre){ return objPadre.id == obj.parent; });
        		if(objPadre != null && (sumaHermanos - obj.valor + valor ) > objPadre.valor){
        			var error = "La suma de los hermanos incluyendome supera el valor del padre hermano : " + (sumaHermanos - obj.valor + valor) +"padre" + objPadre.valor;
            		console.log(error);
            		return error;
        		}
        	}
        	return true;        	        	
        };
        
        $scope.getChilds = function(nodoParent){  //console.log("getChilds.("+nodoParent+")" + debug++);   	    		
	    	return _.filter($scope.gastos, function(ref){ return ref.parent == nodoParent; } ); 	    	        	        	
	    };    
	    
	    $scope.getNodes = function(nodoParent){  //console.log("getChilds.("+nodoParent+")" + debug++);
	    	return _.filter($scope.gastos, function(obj){ return obj.id == nodoParent; });
	    };
        
        $scope.update = function(bookmark){  //console.log("update.("+bookmark+")" + debug++);        	
            if($scope.bookmarkForm.$valid){
            	if($scope.selected != ''){           		
            		var gto = _.find($scope.gastos, function(obj){ return obj.id == $scope.selected; });
            		if(bookmark.end === true && $scope.tieneHijos(gto.id)){                				
        				$scope.eliminarHijos(gto.id);
        			}        			
            		gto.categoria = bookmark.category;
            		gto.valor = bookmark.title;
            		gto.end = bookmark.end; 
            		gto.fecha = bookmark.fecha.toJSON();  
            		gto.observacion = bookmark.observacion != null ? bookmark.observacion : null;
            		$scope.gastos.$save(gto).then(function() {
        	        	$scope.init();
        	        });
                    $scope.updateDataChar();
            	}
                $('#bookmarkModal').modal('hide');
            }
        };
        
        
        var addGasto = function(bookmark) { //console.log("addGasto.("+bookmark+")" + debug++);

	        $scope.gastos.$add({
	        	id: (secunce++).toString() , 
	        	parent: $scope.selected, 
	        	categoria:bookmark.category, 
	        	valor: bookmark.title , 
	        	saldo: 0, 
	        	fecha : bookmark.fecha.toJSON(),
	        	end : bookmark.end != null ? bookmark.end : false, 
	        			observacion : bookmark.observacion != null ? bookmark.observacion : null
	        }).then(function() {
	        	$scope.init();
	        });
        };
          
        $scope.save = function(bookmark){  //console.log("save.("+bookmark+")" + debug++);
            if($scope.bookmarkForm.$valid){            	
                addGasto(bookmark);
                console.log($scope.gastos);                                  
                $('#bookmarkModal').modal('hide');
            }
        };

        $scope.remove = function(id){
            for(var i=0,len=$scope.bookmarks.length;i<len;i++){
                if($scope.bookmarks[i].id === id){
                    $scope.bookmarks.splice(i,1);
                    break;
                }
            }
        };  
        
        $scope.updateDataChar();
    }])
    .directive('orgCharts', function () {
    	return {
    		require : 'ngModel',
            link: function (scope, element, attrs, ngModel) {
                var collection = attrs.ngModel;                
                scope.$watch(collection,function(values){
                	var chart = new google.visualization.OrgChart(element[0]);
                    if(values){
                    	var data = google.visualization.arrayToDataTable(values);
                        var options = {
                            'title': '1111111',
                            'allowCollapse' : true,
                            'allowHtml': true,
                            'selectionColor' : '#d1e1f1'
                        };
                        chart.draw(data, options);               
                        google.visualization.events.addListener(chart, 'select', function() {
                        	 var selectedItem = chart.getSelection()[0];
                        	  if (selectedItem) {
                        	      var selectedValue = data.getValue(selectedItem.row, 0);            	      
                        	      scope.$apply(function(){                        	    	  
                        	    	  scope.selected = selectedValue; console.log(selectedValue);
                        	      });
                        	  }
                        });
                    }
                },true);
            }
        };
    }); 
    
})();