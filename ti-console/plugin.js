
arc.run(['$rootScope', function ($rootScope) {

   $rootScope.plugin("arcConsole", "TI Console", "page", {
      menu: "tools",
      icon: "fa-terminal",
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

         $scope.lists.allSnippets = $rootScope.process_snippets;

         $scope.replaceAdditionalString = function(string){
            var newString = string.replace(/\{/g, "");
            var newString = newString.replace(/\}/g, "");
            for(var i=0; i<10; i++){
               var stringToReplace = "$"+i+":";
               var newString = newString.replace(stringToReplace, "");
            }
            return newString;
         };

         $scope.cleanAllFunctions = function(){
            $scope.lists.allFunctionsCleaned = [];
            for(f in $scope.lists.allFunctions){
               var func = $scope.lists.allFunctions[f];
               var newSnippet = $scope.replaceAdditionalString(func.snippet);
               var newFunction = {
                  value: func.value,
                  snippet: newSnippet
               }
               $scope.lists.allFunctionsCleaned.push(newFunction);
            }
         };

         $scope.cleanAllFunctions();

         $scope.cleanAllSnippets = function(){
            $scope.lists.allSnippetsCleaned = [];
            for(f in $scope.lists.allSnippets){
               var func = $scope.lists.allSnippets[f];
               var newSnippet = $scope.replaceAdditionalString(func.snippet);
               var newSnippet = {
                  value: func.value,
                  snippet: newSnippet
               }
               $scope.lists.allSnippetsCleaned.push(newSnippet);
            }
         };

         $scope.cleanAllSnippets();

         $scope.showScript = false;

         $scope.newTiFunctions = [{instance:$scope.instance, icon:'',function:''}];

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
            //Arrow up
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

         //Functions
         $scope.Execute = function (tiFunction, instance) {
            //Add function to list
            $scope.updateindexTiFunctions("reset");
            //Execute TI
            $scope.queryStatus = 'executing';
            //	TM1 version < PAL 2.0.5: /ExecuteProcess
            //	TM1 version > PAL 2.0.5: /ExecuteProcessWithReturn?$expand=ErrorLogFile
            if($scope.tm1VersionSupported){
               var executeQuery = "/ExecuteProcessWithReturn?$expand=ErrorLogFile";
            } else {
               var executeQuery = "/ExecuteProcess";
            }
            body = {
               Process: {
                  Name: "TIConsole",
                  PrologProcedure: tiFunction
               }
            };
            var config = {
               method: "POST",
               url: encodeURIComponent(instance) + executeQuery,
               data: body
            };
            $http(config).then(function (result) {
               var newFunction = {};
               var errorLogFile = result.data.ErrorLogFile;
               //If ErrorLogFile does not exists => SUCCESS
               if (errorLogFile == null) {
                  newFunction = {
                     instance: instance,
                     icon:'fa-check-circle',
                     function:tiFunction,
                     message:"",
                     showMessage:false
                  }
                  $scope.newTiFunctions.splice(1, 0, newFunction);
               } else {
                  //Get ErrorLogFileContent
                  var errorLogFileName = errorLogFile.Filename;
                  var configErrorQuery = {
                     method: "GET",
                     url: encodeURIComponent(instance) + "/ErrorLogFiles('"+errorLogFileName+"')/Content"
                  };
                  $http(configErrorQuery).then(function (result) {
                     var errorLogFileContent = result.data;
                     newFunction = {
                        instance: instance,
                        icon:'fa-warning',
                        function:tiFunction,
                        message:errorLogFileContent,
                        showMessage:true
                     } 
                     $scope.newTiFunctions.splice(1, 0, newFunction);
                  });                
               }
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