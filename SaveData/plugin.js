
// Uncomment the code arc.run.. below to enable this plugin

arc.run(['$rootScope', function ($rootScope) {

   $rootScope.plugin("arcSaveData", "Save Data", "page", {
      menu: "administration",
      icon: "fa-cubes",
      description: "This plugin can be used to randomize data for any cubes",
      author: "Cubewise",
      url: "https://github.com/cubewise-code/arc-plugins",
      version: "1.0.0"
   });

}]);

arc.directive("arcSaveData", function () {
   return {
      restrict: "EA",
      replace: true,
      scope: {
         instance: "=tm1Instance"
      },
      templateUrl: "__/plugins/SaveData/template.html",
      link: function ($scope, element, attrs) {

      },
      controller: ["$scope", "$rootScope", "$http", "$tm1", "$translate", "$timeout", "ngDialog", function ($scope, $rootScope, $http, $tm1, $translate, $timeout, ngDialog) {

         //Define variables
         $scope.defaults = {
            optionsShow : 'SaveDataAll',
            selectAllCubes : false,
            title:'SaveDataAll or CubeSaveData'
         };
         $scope.selections = {
            optionsShow : $scope.defaults.optionsShow,
            targetFolder: "C:/Arc/plugins/randomise-data",
            cubeFilter:'',
            cubeSelectedFilter:'',
            showAlert:true,
            title: $scope.defaults.title,
            responseTimeMs: 0
         };
         $scope.lists = {
            cubes: [],
            cubesTarget: [],
            cubesRandomized: [],
            optionsSaveData:[
               {name:'SaveDataAll',icon:'cubes', align:'pull-right'},
               {name:'CubeSaveData',icon:'cube', align:'pull-left'}]
         };
         $scope.values = {};

         $scope.showCubeSelection = true;

         $scope.removeFromCubesTarget = function(cube){
            $scope.lists.cubesTarget.splice($scope.lists.cubesTarget.indexOf(cube), 1);
         }

         //Functions
         $scope.getCubes = function () {
            var query = "";
            var queryAll = "/Cubes?$select=Name,LastDataUpdate,LastSchemaUpdate";
            var queryWithoutControlObjects = "/Cubes?$select=Name,LastDataUpdate,LastSchemaUpdate&$filter=indexof(Name,'}') eq -1";
            if ($rootScope.uiPrefs.controlObjects) {
               query = queryAll;
            } else {
               query = queryWithoutControlObjects;
            }
            $http.get(encodeURIComponent($scope.instance) + query).then(function (result) {
               $scope.lists.cubes = result.data.value;
            });
         };
         $scope.getCubes();

         // TOGGLE DELETE VIEWS
         $scope.cubesToSave = [];
         $scope.toggleCubeToSave = function (item) {
            //console.log(item);
            if (_.includes($scope.cubesToSave, item)) {
               _.remove($scope.cubesToSave, function (i) {
                  return i.Name === item.Name;
               });
            } else {
               $scope.cubesToSave.push(item);
            }
         };
         $scope.toggleAllCubeToSave = function () {
            if(!$scope.defaults.selectAllCubes){
               $scope.cubesToSave = [];
               for(var c in $scope.lists.cubes){
                  $scope.lists.cubes[c].saveData=false;
               }
            }else{
               $scope.cubesToSave = [];
               for(var c in $scope.lists.cubes){
                  $scope.lists.cubes[c].saveData=true;
                  $scope.cubesToSave.push($scope.lists.cubes[c]);
               }
            }            
         };

         //OPEN MODAL WITH SAVEDATALL
         $scope.openModalSaveDataAll = function () {
            $scope.selections.responseTimeMs = 0;
            var dialog = ngDialog.open({
               className: "ngdialog-theme-default small",
               template: "__/plugins/SaveData/m-saveDataAll.html",
               name: "Instances",
               scope: $scope,
               controller: ['$rootScope', '$scope', function ($rootScope, $scope) {
                  $scope.cubesToSave = $scope.ngDialogData.cubesToSave;

                  $scope.saveDataAll = function () {
                     console.log("SaveData executed")
                     var sendDate = (new Date()).getTime();
                     var prolog = "SaveDataAll;";
                     body = {
                        Process: {
                           PrologProcedure: prolog
                        }
                     };
                     var config = {
                        method: "POST",
                        url: encodeURIComponent($scope.instance) + "/ExecuteProcess",
                        data: body
                     };
                     $http(config).then(function (result) {
                        if (result.status == 200 || result.status == 201 || result.status == 204) {
                           $scope.saveDataStatus=true;
                        } else {
                        }
                        var receiveDate = (new Date()).getTime();
                        $scope.selections.responseTimeMs = receiveDate - sendDate;
                     });
                  }
               }],
               data: {
                  cubesToSave: $scope.cubesToSave
               }
            });
         };

         //OPEN MODAL WITH SAVEDATALL
         $scope.openModalSaveData = function () {
            $scope.selections.responseTimeMs = 0;
            var dialog = ngDialog.open({
               className: "ngdialog-theme-default small",
               template: "__/plugins/SaveData/m-saveData.html",
               name: "Instances",
               scope: $scope,
               controller: ['$rootScope', '$scope', function ($rootScope, $scope) {
                  $scope.cubesToSave = $scope.ngDialogData.cubesToSave;
               }],
               data: {
                  cubesToSave: $scope.cubesToSave
               }
            });
         };

         $scope.saveDataPerCubes = function () {
            $scope.selections.responseTimeMs = 0;
            for(var c in $scope.cubesToSave){
               $scope.saveDataForOneCube($scope.cubesToSave[c]);
            }
         }

         $scope.saveDataForOneCube = function(cube){
            console.log(cube.Name+" saved to disk");
            cube.sendDate = (new Date()).getTime();
            var prolog = "CubeSaveData('"+cube.Name+"');";
            body = {
               Process: {
                  PrologProcedure: prolog
               }
            };
            var config = {
               method: "POST",
               url: encodeURIComponent($scope.instance) + "/ExecuteProcess",
               data: body
            };
            $http(config).then(function (result) {
               if (result.status == 200 || result.status == 201 || result.status == 204) {
                  $scope.saveDataStatus=true;
               } else {
               }
               cube.receiveDate = (new Date()).getTime();
               cube.responseTimeMs = cube.receiveDate - cube.sendDate;
               $scope.selections.responseTimeMs = $scope.selections.responseTimeMs + cube.responseTimeMs;
            });
         }

         //Trigger an event after the login screen
         $scope.$on("login-reload", function (event, args) {

         });

         //Close the tab
         $scope.$on("close-tab", function (event, args) {
            // Event to capture when a user has clicked close on the tab
            if (args.page == "arcSaveData" && args.instance == $scope.instance && args.name == null) {
               // The page matches this one so close it
               $rootScope.close(args.page, { instance: $scope.instance });
            }
         });

         //Trigger an event after the plugin closes
         $scope.$on("$destroy", function (event) {

         });


      }]
   };
});