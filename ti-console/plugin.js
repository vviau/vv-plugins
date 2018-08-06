
arc.run(['$rootScope', function ($rootScope) {

   $rootScope.plugin("arcConsole", "TI Console", "page", {
      menu: "tools",
      icon: "fa-square",
      description: "This plugin can be used as a starting point for building new page plugins",
      author: "Cubewise",
      url: "https://github.com/cubewise-code/arc-plugins",
      version: "1.0.0"
   });

}]);

arc.directive("arcConsole", function () {
   return {
      restrict: "EA",
      replace: true,
      scope: {
         instance: "=tm1Instance"
      },
      templateUrl: "__/plugins/ti-console/template.html",
      link: function ($scope, element, attrs) {

      },
      controller: ["$scope", "$rootScope", "$http", "$tm1", "$translate", "$timeout", "$helper", function ($scope, $rootScope, $http, $tm1, $translate, $timeout, $helper) {

         //Define variables
         $scope.defaults = {};
         $scope.selections = {};
         $scope.lists = {};
         $scope.values = {};
         $scope.code = {
            prolog: '',
            epilog: ''
         };

         $scope.lists.allFunctions = $rootScope.process_functions;

         $scope.showScript = false;

         $scope.newTiFunctions = [{instance:$scope.instance, icon:'',function:''}];

         $scope.tiFunctions = {
            types: [{name:'dimensions',icon:'dimensions'},
                  {name:'cubes',icon:'cubes'},
                  {name:'processes',icon:'processes'},
                  {name:'administration',icon:'fa-server'}],
            dimensions : [
               { icon: "dimensions", function: "ATTRS", desc: "Update a string attribute value" },
               { icon: "dimensions", function: "ATTRN", desc: "Update a numeric attribute value" },
               { icon: "dimensions", function: "DimensionElementInsert('DimName', 'InsertionPoint', 'ElName', 'ElType')", desc: "Update a numeric attribute value" }
            ],
            cubes : [{ icon: "cubes", function: "CubeCreate", desc: "Create a cube" },
            { icon: "cubes", function: "CubeDelete", desc: "Delete a cube" }],
            processes : [{ icon: "processes", function: "ExecuteProcess('ProcessName')", desc: "Create a cube" },
            { icon: "processes", function: "ProcessDelete('ProcessName')", desc: "Delete a cube" }],
            administration : [{ icon: "administration", function: "SaveDataAll", desc: "Save data for all cubes" },
            { icon: "cubes", function: "RefreshMDX", desc: "Refresh MDX default member and levels" }]
         };

         $scope.indexTiFunctions = $scope.newTiFunctions.length - 1;

         $scope.inputs = {};

         $scope.instanceSelected = $scope.instance;

         $scope.getInstances = function () {
            $tm1.instances().then(function (data) {
                $scope.lists.instances = data;
            });
        };

        $scope.getInstances();

         $scope.key = function ($event, funcIndex, func, instance) {
            //console.log($event.keyCode);
            //Arrow up
            //console.log(funcIndex, $scope.newTiFunctions[funcIndex].function);
            if ($event.keyCode == 38) {
               $scope.newTiFunctions[funcIndex].function = $scope.newTiFunctions[$scope.indexTiFunctions].function;
               $scope.updateindexTiFunctions("-1");
            }
            //Arrow down
            else if ($event.keyCode == 40) {
               $scope.newTiFunctions[funcIndex].function = $scope.newTiFunctions[$scope.indexTiFunctions].function;
               $scope.updateindexTiFunctions("+1");
            }
            //Enter
            else if ($event.keyCode == 13) {
               $scope.Execute(func, instance);
            }
         }

         $scope.updateindexTiFunctions = function (string) {
            if (string == "reset") {
               $scope.indexTiFunctions = $scope.newTiFunctions.length - 1;
            } else if (string == "+1") {
               var newindex = $scope.indexTiFunctions + 1;
               if (newindex > $scope.newTiFunctions.length - 1) {
                  $scope.indexTiFunctions = 0;
               } else {
                  $scope.indexTiFunctions = newindex;
               }
            } else if (string == "-1") {
               var newindex = $scope.indexTiFunctions - 1;
               if (newindex < 0) {
                  $scope.indexTiFunctions = $scope.newTiFunctions.length - 1;
               } else {
                  $scope.indexTiFunctions = newindex;
               }
            }
         };

         //Functions
         $scope.Execute = function (value, instance) {
            //Add function to list
            $scope.updateindexTiFunctions("reset");
            //Execute TI
            $scope.queryStatus = 'executing';
            body = {
               Process: {
                  PrologProcedure: value +";"
               }
            };
            var config = {
               method: "POST",
               url: encodeURIComponent(instance) + "/ExecuteProcess",
               data: body
            };
            $http(config).then(function (result) {
               console.log(result);
               if (result.status == 200 || result.status == 201 || result.status == 204) {
                  newFunction = {
                     instance: instance,
                     icon:'fa-check-circle',
                     function:value,
                     message:"",
                     showMessage:false
                  }
               } else {
                  newFunction = {
                     instance: instance,
                     icon:'fa-warning',
                     function:value,
                     message:result.data.error.message,
                     showMessage:false
                  }                  
               }
               $scope.newTiFunctions.splice(1, 0, newFunction);
            });
         };

         //Functions
         $scope.ExecuteTI = function () {
            $scope.queryStatus = 'executing';
            body = {
               Process: {
                  PrologProcedure: $scope.code.prolog,
                  EpilogProcedure: $scope.code.epilog
               }
            };
            var config = {
               method: "POST",
               url: encodeURIComponent($scope.instance) + "/ExecuteProcess",
               data: body
            };
            $http(config).then(function (result) {
               if (result.status == 200 || result.status == 201 || result.status == 204) {
                  $scope.queryStatus = 'success';
               } else {
                  $scope.queryStatus = 'failed';
               }
            });
         };

         //Check TM1 Version
         $scope.checkTM1Version = function () {
            $scope.tm1VersionSupported = false;
            $scope.instanceData = {};
            $tm1.instance($scope.instance).then(function (data) {
               $scope.instanceData = data;
               if ($helper.versionCompare($scope.instanceData.ProductVersion, "11.1.0") >= 0) {
                  $scope.tm1VersionSupported = true;
               };
            });
         };
         // Execute checkTM1Version
         $scope.checkTM1Version();


         //Trigger an event after the login screen
         $scope.$on("login-reload", function (event, args) {

         });

         //Close the tab
         $scope.$on("close-tab", function (event, args) {
            // Event to capture when a user has clicked close on the tab
            if (args.page == "arcConsole" && args.instance == $scope.instance && args.name == null) {
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